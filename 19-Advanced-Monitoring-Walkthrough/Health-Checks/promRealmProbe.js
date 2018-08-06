const Realm = require("realm");
const promClient = require("prom-client");
const http = require("http");

const server = '<IP_ADDRESS_OF_ROS:PORT>';
const username = '<USERNAME>';
const password = '<PASSWORD>';
const realmPath = '<REALM_PATH>';

function probe() {
    return new Promise(async (resolve, reject) => {
        // set a timer to reject the promise in 5 seconds
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);

        const user = await Realm.Sync.User.login(`http://${server}`, username, password);
        const realm = await Realm.open({ sync: { user, url: `realm://${server}/${realmPath}`}});
        realm.close();

        // we successfully logged in and opened a realm - now clear the timeout timer
        clearTimeout(timeout);

        resolve();
    });
}

// create a Prometheus metrics registry and the reachability metric
const registry = new promClient.Registry();
registry.setDefaultLabels({ server }); // add a Prometheus label to the metric for the server we're testing
const isReachable = new promClient.Gauge({
    name: 'ros_reachability',
    help: 'Is the ROS instance reachable and syncing',
});
registry.registerMetric(isReachable);

// create an endpoint for Prometheus to scrape
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', registry.contentType);
    res.end(registry.metrics());
});
server.listen(9086);

// begin a probing loop that will update the gauge once every minute
setInterval(async () => {
    try {
        await probe();
        isReachable.set(1, Date.now());
    } catch (error) {
        console.error(error);
        isReachable.set(0, Date.now());
    }
}, 1 * 60 * 1000);