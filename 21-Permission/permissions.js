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

const Schema = require('./schema')
const Realm = require('realm')

module.exports = {
    createPrivateRoom: function (realm, roomName) {
        realm.write(() => {
            realm.create(Schema.PrivateChatRoomSchema.name, { name: roomName })
        })
        finish(realm)
    },

    createPublicRoom: function (realm, roomName) {
        realm.write(() => {
            realm.create(Schema.PublicChatRoomSchema.name, { name: roomName })
        })
        finish(realm)
    },

    grantReadPermission: async function (realm, userId, roomName) {
        await subscribe(realm)
        _grantReadPermission(realm, userId, roomName)
        finish(realm)
    },

    grantWritePermission: async function (realm, userId, roomName) {
        await subscribe(realm)
        _grantWritePermission(realm, userId, roomName)
        finish(realm)
    },

    unGrantReadPermission: async function (realm, userId, roomName) {
        await subscribe(realm)
        _unGrantReadPermission(realm, userId, roomName)
        finish(realm)
    },

    unGrantWritePermission: async function (realm, userId, roomName) {
        await subscribe(realm)
        _unGrantWritePermission(realm, userId, roomName)
        finish(realm)
    },

    lockSchema: async function (realm) {
        await subscribe(realm)
        _lockSchema(realm)
        finish(realm)
    }
}

function _grantReadPermission(realm, userId, roomName) {
    realm.write(() => {
        // find the private chat room
        const room = realm.objects(Schema.PrivateChatRoomSchema.name).filtered(`name = '${roomName}'`)[0]

        // find the permission user
        const user = realm.objects(Realm.Permissions.User.schema.name).filtered(`id = '${userId}'`)[0]

        // check if this user has already a permission
        const userPermissions = room.permissions.filtered(`role.name = '${user.role.name}'`)
        if (userPermissions.isEmpty()) {
            // create a permission using the built-in role of the user
            const permission = realm.create(Realm.Permissions.Permission.schema.name, { canRead: true, canQuery: true, role: user.role })

            // add it permission to the project
            room['permissions'].push(permission)

        } else {
            userPermissions[0].canRead = true
            userPermissions[0].canQuery = true
        }
    })
}

function _unGrantReadPermission(realm, userId, roomName) {
    realm.write(() => {
        // find the private chat room
        const room = realm.objects(Schema.PrivateChatRoomSchema.name).filtered(`name = '${roomName}'`)[0]

        // find the permission user
        const user = realm.objects(Realm.Permissions.User.schema.name).filtered(`id = '${userId}'`)[0]

        // find the permission granted to the user to modify it
        const userPermission = room.permissions.filtered(`role.name = '${user.role.name}'`)[0]

        userPermission.canRead = false
        userPermission.canQuery = false
    })
}

function _grantWritePermission(realm, userId, roomName) {
    realm.write(() => {
        // find the private chat room
        const room = realm.objects(Schema.PrivateChatRoomSchema.name).filtered(`name = '${roomName}'`)[0]

        // find the permission user
        const user = realm.objects(Realm.Permissions.User.schema.name).filtered(`id = '${userId}'`)[0]

        // check if this user has already a permission
        const userPermissions = room.permissions.filtered(`role.name = '${user.role.name}'`)
        if (userPermissions.isEmpty()) {
            // create a new permission using the built-in role of the user
            //
            // Note: sometimes it makes sense to grant a particular user only `write` permission without read
            //       this can happen when a user is authorized only to write to a log for instance. In our Chat app
            ///      giving a user a write only permission doesn't make sense (he/she should have read granted as well).
            const permission = realm.create(Realm.Permissions.Permission.schema.name, { canUpdate: true, canRead: true, canQuery: true, role: user.role })
            // and it permission to the room
            room['permissions'].push(permission)

        } else {
            userPermissions[0].canUpdate = true
            // giving the user read permission as well (as explained previously above)
            userPermissions[0].canRead = true
            userPermissions[0].canQuery = true
        }
    })
}

function _unGrantWritePermission(realm, userId, roomName) {
    realm.write(() => {
        // find the private chat room
        const room = realm.objects(Schema.PrivateChatRoomSchema.name).filtered(`name = '${roomName}'`)[0]

        // find the permission user
        const user = realm.objects(Realm.Permissions.User.schema.name).filtered(`id = '${userId}'`)[0]

        // find the permission granted to the user to modify it
        const userPermission = room.permissions.filtered(`role.name = '${user.role.name}'`)[0]

        userPermission.canUpdate = false
    })
}

function _lockSchema(realm) {
    realm.write(() => {
        // Remove update permissions from the __Role table to prevent a malicious user
        // from adding themselves to another user's private role.
        const rolePermission = realm.objects(Realm.Permissions.Class.schema.name).filtered(`name = '${Realm.Permissions.Role.schema.name}'`)[0].permissions[0]
        rolePermission.canUpdate = false
        rolePermission.canCreate = false// we use the user private role, no other roles are allowed to be created

        // Lower "everyone" Role on Message, PrivateChatRoom and PublicChatRoom to restrict permission modifications
        const messagePermission = realm.objects(Realm.Permissions.Class.schema.name).filtered(`name = '${Schema.MessageSchema.name}'`)[0].permissions[0]
        const publicChatPermission = realm.objects(Realm.Permissions.Class.schema.name).filtered(`name = '${Schema.PublicChatRoomSchema.name}'`)[0].permissions[0]
        const privateChatPermission = realm.objects(Realm.Permissions.Class.schema.name).filtered(`name = '${Schema.PrivateChatRoomSchema.name}'`)[0].permissions[0]

        messagePermission.canQuery = false // Message are not queryable since they're accessed only via the Realm List (from PublicChatRoom or PrivateChatRoom)
        messagePermission.canSetPermissions = false
        publicChatPermission.canSetPermissions = false
        privateChatPermission.canSetPermissions = false

        // Lock the permission and schema
        const everyonePermission = realm.objects(Realm.Permissions.Realm.schema.name).filtered('id = 0')[0].permissions[0]
        everyonePermission.canModifySchema = false
        everyonePermission.canSetPermissions = false
    })
}

const subscribe = async function (realm) {
    return new Promise(function (resolve, reject) {
        const privateRooms = realm.objects(Schema.PrivateChatRoomSchema.name)
        const subscription = privateRooms.subscribe()

        subscription.addListener((sub, state) => {
            if (state === Realm.Sync.SubscriptionState.Complete) {
                resolve()
            } else if (state === Realm.Sync.SubscriptionState.Error) {
                reject(Error('Could not subscribe to PrivateChatRoom objects'))
            }
        })
    })
}

function finish(realm) {
    // wait for data to be uploaded to the server
    realm.syncSession.addProgressNotification('upload', 'forCurrentlyOutstandingWork', (transferred, transferable) => {
        if (transferred === transferable) {
            process.exit(0)
        }
    })
}

