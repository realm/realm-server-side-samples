A demo that demonstrates the usage of the permission API. 

This is a complimentary app to the Realm Cloud Chat App https://github.com/realm/my-first-realm-app/tree/master/android/ObjectPermissionAdvanced it shows how you can:

- Create a public and private chat rooms.
- Grant/Ungrant `read`/`write` permission for a user to use a private chat room.
- Lock the schema to prevent modifications and malicious usage of the permission API.

## Install
- Edit [config.js](./config.js) to set the credentials variables _(the app needs an admin user to perform permission operations)_.

-

```
nvm use 8
npm install
```

## Available commands

- Lock the schema: 

This is probably the first command you want to run, since it will create the reference Realm, upload the schema then lock it against modification, it also lower the default permission to be more restrictive.
```
node index.js --lock
```

- Create chat rooms: 

public room
```
node index.js --create General
```

private room 
```
node index.js --create Sales -p
```

_creating rooms could be done using a regular user_

- Grant `read` permission:

```
node index.js --grant read --user nh@realm.io --room Sales
```

This will create (if needed) a permission within the `Sales` private chat room for the user `nh@realm.io` to grant him `read` access. 

_`nh@realm.io` is the user's `provderId`, the user needs to connect to the chat Realm prior to be able to add him to a private room._

- Ungrant `read` permission: 
```
node index.js --ungrant read --user nh@realm.io --room Sales
```

- Grant `write` permission:

```
node index.js --grant write --user nh@realm.io --room Sales
```

- Ungrant `write` permission

```
node index.js --ungrant write --user nh@realm.io --room Sales
```

