# JWT Authentication Servers

1. Run `npm install`
2. After running `npm install` it should generate 2 keys `publickey.pem` and `privatekey.pem`

__There are 2 servers here__. 

* [auth-server.js](auth-server.js) which is just an express server that does some authentication logic and generates a jwtToken string signed by the privatekey.pem
* [ros-server.js](ros-server.js) which has the configured ros server that has the publickey.pem passed in. 

You can use whatever server or technology you want to generate the jwtToken so long as it is signed by the privatekey.pem and has the same payload like so:

```js
const payload = {
  userId: '123',
  isAdmin: true // optional
  // other properties (ignored by Realm Object Server)
};
```

Generating the keys:

1. You can run `npm run generatekeys`. It will generate a privatekey.pem and publickey.pem
2. You can run `npm run deletekeys` and it will delete those keys.