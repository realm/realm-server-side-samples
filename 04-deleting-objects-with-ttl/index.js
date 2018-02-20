const Realm = require('realm');
const moment = require('moment');
const faker = require('faker');

const SERVER_URL = 'REPLACE_ME'

const ProductSchema = {
  name: 'Product',
  primaryKey: 'string',
  properties: {
    productId: 'int',
    price: { type: 'float', default: 0 },
    createdOn: { type: 'date', default: Date.now() },
    expiresOn: { type: 'date', default: moment().add(5, 's').toDate() } // expires after 5 seconds
  }
}

async function main() {
  const adminUser = await Realm.Sync.User.login(`https:${SERVER_URL}`, 'realm-admin', 'REPLACE_ME')
  const realm = new Realm({
    sync: {
      user: adminUser,
      url: `realms://${SERVER_URL}/products`
    }
  })
  // lets add some products
  realm.write(() => {
    for (let index = 0; index < 100; index++) {
      realm.create('Product', {
        productId: index,
        price: faker.random.number({min:5, max:10}),
        createdOn: new Date(),
        // a random expiry date between 1 second and 60 seconds
        expiresOn: moment().add(faker.random.number({min:1, max:60}), 's').toDate()
      })
    }
  })

  setInterval(() => {
    const expiredObjects = realm.objects('Product').filtered('expiresOn <= $0', new Date())
    if (expiredObjects.length == 0) {
      // if no expired objects don't make a database transaction
      return
    }
    realm.write(() => {
      realm.delete(expiredObjects)
    })
  }, 2000) // poll every 2 seconds
}
main()