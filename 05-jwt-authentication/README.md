# JWT Authentication 

There are 3 components to making JWT Authentication Work.

* [A Custom Server that does the authentication logic and signs a JWT Token](server/auth-server.js). This doesn't need to know about Realm at all. It just uses a public and private key to sign a jwt token that it will give to the client
* [ROS with JWT Enabled and ready to consume the public key used to sign incoming JWT tokens](server/ros-server.js)
* A Realm Client which will first make a request with credentials to `auth-server.js`. Then it will snag the jwt token and then proceed to authenticate the Realm.Sync client with the JWT against a running ROS server

### Overall it's a simple 2 step process.

1. ROS or Realm Cloud just needs to have `JwtAuthProvider` setup with a public key
2. The Custom Auth Server needs to sign the token with the `privatekey.pem`

### How do I generate proper keys?

Take a look at [server/keygen.sh](server/keygen.sh)

### What about Realm Cloud? 

If you need to get JWT setup with Realm Cloud...

1. Generate the private keys, check out the commands here: [server/keygen.sh](server/keygen.sh)
2. Copy the public key in the settings in Realm Cloud's settings 
3. Follow the general pattern laid out above!
