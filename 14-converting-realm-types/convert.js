const Realm = require('realm')
const fs = require('fs')

//insert the your instance URL and login info for an admin
const URL = 'localhost:9080';
const username = 'realm-admin';
const password = 'password';
var realmPath = "/__admin"

const errorCallback = function errorCallback(message, isFatal, category, code) {
    console.log(`Message: ${message} - isFatal: ${isFatal} - category: ${category} - code: ${code}`)
}

//if using SSL (or cloud) modify to https and realms 
Realm.Sync.User.login(`http://${URL}`, username, password)
.then((user) => {
    Realm.open({
        sync: {
            url: `realm://${URL}${realmPath}`,
            user: user,
            error: errorCallback,
            fullSynchronization: true
        },
    })
        .then((realm) => {
            let files = realm.objects('RealmFile');
            realm.write(() => {
                files.forEach(element => {
                    if(!element.path.includes('__') && (element.realmType === 'full' || !element.realmType)) {
                    element.realmType = 'reference';
                  }
                });
              });
        })
});
