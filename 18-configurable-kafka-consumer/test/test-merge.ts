import * as Realm from 'realm';
import {Update, applyUpdate} from '../src/realm-merge';

function assert(test: boolean, message: string) {
    if (!test) {
        throw new Error(message);
    }
}

async function tests() {
    console.log("Starting tests");

    const PersonSchema = {
        name: 'Person',
        primaryKey: 'id',
        properties: {
            id:      'string',
            name:    'string',
            age:     'int',
            boss:    'Person',
            friends: 'Person[]',
            item:    'Item',
            items:   'Item[]'
        }
    };
    const ItemSchema = {
        name: 'Item',
        properties: {
            name:   'string',
            weight: 'int',
            items:  'Item[]'
        }
    };

    const realm = await Realm.open({
        schema: [PersonSchema, ItemSchema],
        path: 'test.realm'
    });

    // make sure we start with a clean state
    if (!realm.empty) {
        realm.write(() => {
            realm.deleteAll();
        });
    }

    // Add a test object
    let john : Realm.Object = null;
    realm.write(() => {
        john = realm.create<Realm.Object>("Person", {id: "1", name: "John", age: 32, boss: null, friends: []});
    });

    console.log("TEST: Do a small update");
    {
        const smallupdate: Update = {
            updated: {
                Person: [
                    {id: "1", age: 33}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, smallupdate);
        });
        assert(john['age'] === 33, "Updating age failed");
    }

    console.log("TEST: Add an object");
    {
        const addObject: Update = {
            updated: {
                Person: [
                    {id: "2", name: "Sarah", age: 34, boss: "1"}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, addObject);
        });
        assert(realm.objects("Person").length === 2, "Adding object failed");
    }

    console.log("TEST: Add object with sub-object");
    {
        const addObjectWithFriends: Update = {
            updated: {
                Person: [
                    {id: "3", name: "Jim", age: 20, boss: {id: "4", name: "Annie", age: 40}}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, addObjectWithFriends);
        });
        assert(realm.objects("Person").length === 4, "Adding object failed");
    }

    console.log("TEST: Add object with sub-object without primary key");
    {
        const addObjectWithItem: Update = {
            updated: {
                Person: [
                    {id: "5", name: "Joe", age: 19, item: {name: "box", weight: 12}}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, addObjectWithItem);
        });
        assert(realm.objects("Person").length === 5, "Adding person with item failed");
        assert(realm.objects("Item").length === 1, "Adding item failed");
        assert(realm.objectForPrimaryKey("Person", "5")['item']['name'] === "box", "adding item failed");
    }


    console.log("TEST: Update primary key-less sub-item");
    {
        const updateItem: Update = {
            updated: {
                Person: [
                    {id: "5", item: {name: "square"}}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, updateItem);
        });
        assert(realm.objects("Person").length === 5, "updating person with item failed");
        assert(realm.objects("Item").length === 1, "updating item failed");
        assert(realm.objectForPrimaryKey("Person", "5")['item']['name'] === "square", "updating item failed");
    }

    console.log("TEST: Delete objects");
    {
        const deleteItems: Update = {
            deleted: {
                Person: [
                    "3",
                    "5"
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, deleteItems);
        });
        assert(realm.objects("Person").length === 3, "deleting two objects failed");
        assert(realm.objects("Item").length === 0, "recursively deleting item failed");
    }

    console.log("TEST: Create object with list of sub-objects with primary keys");
    {
        const withList: Update = {
            updated: {
                Person: [
                    {id: "6", name: "Jill", age: 25, friends: ["1", "2", {id: "7", name: "Bruce", age: 2}]}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, withList);
        });
        assert(realm.objectForPrimaryKey("Person", "6")['friends'].length === 3, "creating list failed");
    }

    console.log("TEST: Update list in existing object (prymary keys)");
    {
        const updList: Update = {
            updated: {
                Person: [
                    {id: "6", friends: ["4"]}
                ]
            }
        };
        realm.write(() => {
            applyUpdate(realm, updList);
        });
        assert(realm.objectForPrimaryKey("Person", "6")['friends'].length === 1, "updating list failed");
    }

    console.log("--------------\nTest completed");
}

// Run the tests
tests();