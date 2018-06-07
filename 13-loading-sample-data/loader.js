const faker = require('faker')
const Realm = require('realm')
const fs = require('fs')

var totalTickers = 100

//insert the your connection information  
const URL = 'my-cloud-url.us1.cloud.realm.io';
const username = 'username';
const password = 'password';
var tickerRealmPath = "/tickers"

const TickerSchema = {
    name: 'Ticker',
    properties: {
        'tickerSymbol': { type: 'string', optional: false, default: '' },
        'price': { type: 'float', optional: false, default: 0 },
        'companyName': { type: 'string', optional: false, default: '' }
    }
}

//generates random data to be inserted
function generateRandomTickerSymbol(len) {
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

const errorCallback = function errorCallback(message, isFatal, category, code) {
    console.log(`Message: ${message} - isFatal: ${isFatal} - category: ${category} - code: ${code}`)
}


Realm.Sync.User.login(`https://${URL}`, username, password)
.then((user) => {
    Realm.open({
        sync: {
            url: `realms://${URL}${tickerRealmPath}`,
            user: user,
            error: errorCallback,
            partial: true
        },
        schema: [TickerSchema],
    })
        .then((realm) => {
            let tickerResults = realm.objects('Ticker');
            if (tickerResults.length < totalTickers) {
                //write to the realm
                realm.write(() => {
                    for (let index = 0; index < totalTickers; index++) {
                        realm.create('Ticker', {
                            tickerSymbol: generateRandomTickerSymbol(3),
                            price: index,
                            companyName: faker.company.companyName()
                        }, true)
                    }
                })
            }
            realm.close()
        })
});
