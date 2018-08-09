import * as Realm from 'realm';
import {Update, applyUpdate} from '../src/realm-merge';

function assert(test: boolean, message: string) {
    if (!test) {
        throw new Error(message);
    }
}

async function tests() {
    console.log("Starting tests");

    // Schema definitions
    const accountSchema = {
        name: 'account',
        primaryKey: 'accountToken',
        properties: {
            accountToken: 'string',
            creationDate: 'date',
            lastModifiedDate: 'date',
            status: 'bool',
            expirationDate: 'date',
            packages: 'package[]'
        }
    }
    const channelSchema = {
        name: 'channel',
        primaryKey: 'CID',
        properties: {
            CID: 'string',
            CCID: 'string',
            channelNumber: 'string',
            itemType: 'string',
            channelName: 'string'
        }
    }
    const packageSchema = {
        name: 'package',
        primaryKey: 'packageId',
        properties: {
            packageId: 'string',
            description: 'string',
            channels: 'channel[]'
        }
    }

    const realm = await Realm.open({
        schema: [accountSchema, channelSchema, packageSchema],
        path: 'att-test.realm'
    });

    // make sure we start with a clean state
    if (!realm.empty) {
        realm.write(() => {
            realm.deleteAll();
        });
    }

    // Add reference objects
    realm.write(() => {
        realm.create<Realm.Object>("package", {packageId: "BasicChoice", description: "basic package", channels: []});
        realm.create<Realm.Object>("package", {packageId: "FilipinoDirect", description: "filipino channels", channels: []});
    
        realm.create<Realm.Object>("account", {accountToken: "LTPFPs0kAouH_nO3gNTMhVS-q1GWySefobFco8EZHRg", 
                                               creationDate: "2016-10-27 07:57:04",
                                               lastModifiedDate: "2017-02-01 00:27:54",
                                               status: true,
                                               expirationDate: "2016-11-10 10:21:37",
                                               packages: []});

    });

    console.log("created test dataset");

    const eEntitlementsInfo = {
        "table": "UPS.Entitlement",
        "op_type": "I",
        "op_ts": "2017-10-06 02:56:34.000370",
        "entitlement": {
            "accountToken": "LTPFPs0kAouH_nO3gNTMhVS-q1GWySefobFco8EZHRg",
            "creationDate": "2016-10-27 07:57:04",
            "lastModifiedDate": "2017-02-01 00:27:54",
            "status": "Active",
            "expirationDate": "2016-11-10 10:21:37",
            "packageCodes": ["BasicChoice", "FilipinoDirect"]
        }
    }

    function mapMsgToRealm(message: {}): Update {
        const entitlement = message["entitlement"];

        const update: Update = {
            updated: {
                'account': [
                    {
                        accountToken:     entitlement['accountToken'],
                        creationDate:     entitlement['creationDate'],
                        lastModifiedDate: entitlement['lastModifiedDate'],
                        status:           (entitlement['status'] === "Active"),
                        expirationDate:   entitlement['expirationDate'],
                        packages:         entitlement['packageCodes']
                    }
                ]
            }
        }
    
        return update;
    }

    console.log("TEST: import new entitlement");
    {
        const upd = mapMsgToRealm(eEntitlementsInfo);

        realm.write(() => {
            applyUpdate(realm, upd);
        });

        const account = realm.objectForPrimaryKey("account", eEntitlementsInfo.entitlement.accountToken);
        assert(account["packages"].length === 2, "Updating package list failed");
        assert(account["packages"][0]["packageId"] === "BasicChoice", "wrong package id");
        assert(account["packages"][1]["packageId"] === "FilipinoDirect", "wrong package id");
    }

    console.log("--------------\nTest completed");
}

tests();