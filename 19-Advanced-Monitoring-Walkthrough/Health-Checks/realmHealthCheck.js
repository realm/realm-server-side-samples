'use strict';

const superagent = require('superagent');

const server = '<IP:PORT_OF_REALM_NODE>';

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

const promise = healthCheck();
promise.then(() => { /* healthCheck is successful, let's tell someone with a webook or counter */
    console.log('success')
});
promise.catch((error) => { /* healthCheck failed, sound the alarm! */
    console.log('fail')
});