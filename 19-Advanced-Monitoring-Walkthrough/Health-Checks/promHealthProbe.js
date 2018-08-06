const Realm = require("realm");
const promClient = require("prom-client");
const http = require("http");
const superagent = require('superagent');

const server = '<IP_ADDRESS_OF_ROS:PORT>';
const healthEndpoint = '<HEALTH_URI_ENDPOINT>';

function healthCheck() {
    return new Promise(async(resolve, reject) => {
        // set a timer to reject the promise in 5 seconds
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);

        superagent
            .get(`http://${server}/${healthEndpoint}`)
            .then(res => {
                if (res.status == '200') {
                    clearTimeout(timeout);
                    resolve();
                } else
                    reject();
            })
            .catch(err => {
                console.error(err)
            })
    });
}

// create a Prometheus metrics registry and the reachability metric
const registry = new promClient.Registry();
registry.setDefaultLabels({ server }); // add a Prometheus label to the metric for the server we're testing
const isHealthy = new promClient.Gauge({
    name: 'health_reachability',
    help: 'Is the realm instance returning healthy from a REST endpoint',
});
registry.registerMetric(isHealthy);

// create an endpoint for Prometheus to scrape
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', registry.contentType);
    res.end(registry.metrics());
});
server.listen(9085);

// begin a probing loop that will update the gauge once every minute
setInterval(async() => {
    try {
        await healthCheck();
        isHealthy.set(1, Date.now());
    } catch (error) {
        console.error(error);
        isHealthy.set(0, Date.now());
    }
}, 1 * 60 * 1000);