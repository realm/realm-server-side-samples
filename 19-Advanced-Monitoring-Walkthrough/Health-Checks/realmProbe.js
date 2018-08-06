const Realm = require("realm");

const server = '<CORE_SERVICES_ENDPOINT>:9080';
const username = 'realm-admin';
const password = '';
const realmPath = '<REALM_URL>';

function probe() {
    return new Promise(async(resolve, reject) => {
        // set a timer to reject the promise in 10 seconds
        const timeout = setTimeout(() => reject(new Error('timeout')), 10000);

        const user = await Realm.Sync.User.login(`http://${server}`, username, password);
        const realm = await Realm.open({ sync: { user, url: `realm://${server}/${realmPath}` } });
        realm.close();

        // we successfully logged in and opened a realm - now clear the timeout timer and resolve the promise
        clearTimeout(timeout);

        resolve();
    });
}

const promise = probe();
promise.then(() => { /* probe is successful, let's tell someone with a webook or something */
    console.log('success')
});
promise.catch((error) => { /* probe failed, sound the alarm! */
    console.log('fail')
});