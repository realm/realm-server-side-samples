// Copyright 2018 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

const Realm = require('realm')

const Config = require('./config')
const Schema = require('./schema')
const Operations = require('./permissions')

// open the Realm and perform operations
Realm.Sync.User.login(`https://${Config.SERVER}`, Config.USERNAME, Config.PASSWORD)
    .then(user => {
        Realm.open({
            sync: {
                url: `realms://${Config.SERVER}/default`,
                user: user,
                fullSynchronization: false,
            },
            schema: [
                Schema.MessageSchema,
                Schema.PublicChatRoomSchema,
                Schema.PrivateChatRoomSchema,
                Realm.Permissions.Permission,
                Realm.Permissions.User,
                Realm.Permissions.Role,
                Realm.Permissions.Class,
                Realm.Permissions.Realm
            ],
        })
            .then(realm => {
                handleOptions(realm)
            })
    })


// --create General (create a public chat room named 'General')
// --create Sales -p (create a private chat room named 'Sales')
// --lock  (lock the schema)
// --grant read --user john@doe.com --room Sales   (grant read permission to the user in the specified private room)
// --ungrant read --user john@doe.com --room Sales   (ungrant read permission to the user in the specified private room)
// --grant write --user john@doe.com --room Sales   (grant write permission to the user in the specified private room)
// --ungrant write --user john@doe.com --room Sales   (ungrant write permission to the user in the specified private room)
// parsing command-line options
let getopt = require('node-getopt').create([
    ['u', 'user=ARG', 'the user provderId (example john@doe.com)'],
    ['r', 'room=ARG', 'the chat room name'],
    ['c', 'create=ARG', 'create a new private chat room'],
    ['p', '', 'designate a private chat room'],
    ['g', 'grant=read|write', 'grant read/write permission to user on a private chat room'],
    ['U', 'ungrant=read|write', 'ungrant the read/write permission to user on a private chat room'],
    ['l', 'lock', 'lock the schmema'],
    ['h', 'help', 'display this text'],
]).bindHelp()
let opt = getopt.parse(process.argv.slice(2))

function handleOptions(realm) {
    if (opt.options['lock']) {
        console.log('Locking schema ...')
        Operations.lockingTheSchema(realm)

    } else if (opt.options['create']) {
        if (opt.options['p']) {
            console.log(`Creating private room: ${opt.options['create']}`)
            Operations.createPrivateRoom(realm, opt.options['create'])

        } else {
            console.log(`Creating public room: ${opt.options['create']}`)
            Operations.createPublicRoom(realm, opt.options['create'])
        }

    } else if (opt.options['grant']) {
        console.log(`Granting ${opt.options['grant']} permission to user: ${opt.options['user']} on private chat room: ${opt.options['room']}`)
        if (opt.options['grant'] === 'read') {
            __lookupPermissionUser(realm, opt.options['user'])
            .then((userId) => { Operations.grantReadPermission(realm, userId, opt.options['room']) })            

        } else if (opt.options['grant'] === 'write') {
            __lookupPermissionUser(realm, opt.options['user'])
            .then((userId) => { Operations.grantWritePermission(realm, userId, opt.options['room']) })

        } else {
            console.error(`Unsupported permission: ${opt.options['grant']}`)
            process.exit(0)
        }

    } else if (opt.options['ungrant']) {
        console.log(`Ungranting ${opt.options['ungrant']} permission to user: ${opt.options['user']} on private chat room: ${opt.options['room']}`)
        if (opt.options['ungrant'] === 'read') {
            __lookupPermissionUser(realm, opt.options['user'])
            .then((userId) => { Operations.unGrantReadPermission(realm, userId, opt.options['room']) })

        } else if (opt.options['ungrant'] === 'write') {
            __lookupPermissionUser(realm, opt.options['user'])
            .then((userId) => { Operations.unGrantWritePermission(realm, userId, opt.options['room']) })

        } else {
            console.error(`Unsupported permission: ${opt.options['ungrant']}`)
            process.exit(0)
        }

    } else {
        opt.showHelp()
        process.exit(0)
    }
}

function __lookupPermissionUser(realm, providerId) {
    return Realm.Sync.User.login(`https://${Config.SERVER}`, Config.USERNAME, Config.PASSWORD)
        .then(user => {
            return Realm.open({
                sync: {
                    url: `realms://${Config.SERVER}/__admin`,
                    user: user,
                    fullSynchronization: true,
                }
            })
                .then(realm => {
                    let users = realm.objects(`User`).filtered(`accounts.providerId = '${providerId}'`)
                    if (!users.isEmpty()) {
                        let userId = users[0].userId;
                        realm.close()
                        return userId;

                    } else {
                        realm.close()
                        console.error(`Could not lookup the userId for ${providerId}`)
                        process.exit(0)
                    }
                })
        })
}