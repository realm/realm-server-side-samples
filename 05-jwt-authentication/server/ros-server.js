const RealmObjectServer = require('realm-object-server');
const fs = require('fs');
const path = require('path');

const BasicServer = RealmObjectServer.BasicServer;
const auth = RealmObjectServer.auth;

const publicKey = fs.readFileSync('./publickey.pem', 'utf8')
const jwt = new auth.JwtAuthProvider({
  publicKey: publicKey
});
const server = new BasicServer()
server.start({
  dataPath: path.join(__dirname, 'data'),
  authProviders: [jwt]
}).catch(err => {
  console.error(err.toString())
})