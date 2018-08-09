// External methods

// this is the format of an update request
export interface Update {
    updated?: {
        [className: string]: {
            [propName: string]: any;
        }[];
    };
    deleted?: {
        [className: string]: string[];
    };
}

export function applyUpdate(realm: Realm, update: Update) {
    // First remove all objects to be deleted
    if (update.hasOwnProperty('deleted')) {
        for (const classprop of Reflect.ownKeys(update.deleted)) {
            const className = classprop.toString();
            const objDeletes = update.deleted[className];

            // Get the primary key for this class
            const pkName = getPrimaryKeyName(realm, className);
            if (pkName === undefined) {
                throw new Error('Only objects with primary keys can be deleted');
            }

            // Delete the objects
            for (let i = 0; i < objDeletes.length; i++) {
                const obj = realm.objectForPrimaryKey(className, objDeletes[i]) as Realm.Object;
                if (obj === undefined) { continue };

                deleteRecursive(realm, obj);
            }
        }
    }

    // update individual objects
    if (update.hasOwnProperty('updated')) {
        for (const className of Reflect.ownKeys(update.updated)) {
            const objUpdates = update.updated[className.toString()];

            for (let i = 0; i < objUpdates.length; i++) {
                const upd = objUpdates[i];
                addOrUpdateObject(realm, className.toString(), upd);
            }
        }
    }
}


// Internal methods -------------------------------------------------------------

function getPrimaryKeyName(realm: Realm, className: string): string {
    const objectSchema = realm.schema.find((s) => s.name === className);
    const pkName = objectSchema.primaryKey;
    return pkName;
}

function datesEqual(first: Date, second: Date): boolean {
    try {
        if (first === null || second === null) {
            return first === second;
        }

        if (!(first instanceof Date)) {
            first = new Date(first);
        }

        if (!(second instanceof Date)) {
            second = new Date(second);
        }

        return first.getTime() === second.getTime();
    }
    catch (err) {
        return false;
    }
}


function addOrUpdateObject(realm: Realm, className: string, update: {[propName: string]: any}): {} {
    const objectSchema = realm.schema.find((s) => s.name === className);
    const pkName = objectSchema.primaryKey;
    if (pkName === undefined) {
        throw new Error('Only objects with primary keys can be updated');
    }
    
    // Check if this is a new object
    const key = update[pkName];
    let obj = realm.objectForPrimaryKey(className, key) as Realm.Object;
    let needSecondPhase = false;

    if (obj === undefined) {
        // There might be required properties, so we have to populate all values before creating the object
        let newObj = {};
        for (const property of Reflect.ownKeys(objectSchema.properties)) {
            const propertyName = property.toString();
            const propValue = update[propertyName];
            if (propValue === undefined) { continue; }

            const prop = objectSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
            switch (prop.type) {
                case 'object':
                case 'list':
                    break; // ignore links for now
                default:
                    newObj[propertyName] = update[propertyName];
            }
        }

        // create the object
        obj = realm.create<Realm.Object>(className, newObj);

        // We add links after the object is created in case there could be circular links
        for (const property of Reflect.ownKeys(objectSchema.properties)) {
            const propertyName = property.toString();
            const propValue = update[propertyName];
            if (propValue === undefined) { continue; }

            const prop = objectSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
            switch (prop.type) {
                case 'object':
                    if (propValue !== null) {
                        updateObjRef(realm, obj, update, propertyName);
                    }
                    break;
                case 'list':
                    if (propValue === null) { break; } // list stays empty

                    if (!(propValue instanceof Array)) {
                        throw new Error('value supplied for list property is not an array');
                    }

                    const realmList = obj[propertyName];
                    updateListRefs(realm, realmList, propValue, prop.objectType);
                    break; 
                default:
                    break;
            }
        }
    }
    else {
        for (const property of Reflect.ownKeys(objectSchema.properties)) {
            const propertyName = property.toString();
            const propValue = update[propertyName];
            if (propValue === undefined) { continue; }

            const prop = objectSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
            switch (prop.type) {
                case 'object':
                    updateObjRef(realm, obj, update, propertyName);
                    break;
                case 'list':
                    const realmList = obj[propertyName];
                    
                    if (propValue === null) {
                        updateListRefs(realm, realmList, [], prop.objectType);
                    }
                    else {
                        updateListRefs(realm, realmList, propValue, prop.objectType);
                    }
                    break;
                case 'date':
                    if (!datesEqual(obj[propertyName], propValue)) {
                        obj[propertyName] = propValue;
                    }
                    break;
                default:
                    if (propValue !== obj[propertyName]) {
                        obj[propertyName] = propValue;
                    }
                    break;
            }

        }
    }

    return obj;
}

function deleteRecursive(realm: Realm, obj: Realm.Object) {
    const objSchema = obj.objectSchema();

    // delete all referenced objects which do not have primary keys
    for (const property of Reflect.ownKeys(objSchema.properties)) {
        const propertyName = property.toString();
        const prop = objSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
        if (prop.type !== 'object' && prop.type !== 'list') { continue }

        // Only delete objects without primary keys
        const pkeyName = realm.schema.find((s) => s.name === prop.objectType).primaryKey;
        if (pkeyName !== undefined) { continue }

        if (prop.type === 'object') {
            if (obj[propertyName] !== null) {
                deleteRecursive(realm, obj[propertyName]);
            }
        }
        else if (prop.type === 'list'){
            const list = obj[propertyName] as Realm.List<Realm.Object>;
            list.forEach((item) => {
                deleteRecursive(realm, item);
            });
        }
    }
    realm.delete(obj);
}

// Udpate or create objects without primary keys
function updateRecursive(realm: Realm, realmObj: Realm.Object, propertyName: string, updateObj: {}) {
    // Get the schema of the the target object
    const className = realmObj.objectSchema().properties[propertyName]['objectType'] as string; 
    const objSchema = realm.schema.find((s) => s.name === className);

    // if there is no object to update, we have to create it
    if (realmObj[propertyName] === null) {
        let newObj = {};
        for (const property of Reflect.ownKeys(objSchema.properties)) {
            const propertyName = property.toString();
            const propValue = updateObj[propertyName];
            if (propValue === undefined) { continue; }

            const prop = objSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
            switch (prop.type) {
                case 'object':
                case 'list':
                    break; // ignore links for now
                default:
                    newObj[propertyName] = updateObj[propertyName];
            }
        }

        // create the object
        let obj = realm.create<Realm.Object>(className, newObj);

        // update links
        for (const property of Reflect.ownKeys(objSchema.properties)) {
            const propertyName = property.toString();
            const propValue = updateObj[propertyName];
            if (propValue === undefined) { continue; }

            const prop = objSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
            switch (prop.type) {
                case 'object':
                    if (updateObj[propertyName] !== null) {
                        updateObjRef(realm, obj, updateObj[propertyName], propertyName);
                    }
                    break;
                case 'list':
                    break; // TODO: update lists
                default:
                    break;
            }
        }

        realmObj[propertyName] = obj;
        return;
    }

    // Update object in place
    let obj = realmObj[propertyName] as Realm.Object;
    for (const property of Reflect.ownKeys(objSchema.properties)) {
        const propertyName = property.toString();
        const propValue = updateObj[propertyName];
        if (propValue === undefined) { continue; }

        const prop = objSchema.properties[propertyName] as Realm.ObjectSchemaProperty;
        switch (prop.type) {
            case 'object':
                updateObjRef(realm, obj, updateObj, propertyName);
                break;
            case 'list':
                break;
            case 'date':
                if (!datesEqual(obj[propertyName], updateObj[propertyName])) {
                    realmObj[propertyName] = updateObj[propertyName];
                }
                break;
            default:
                if (obj[propertyName] !== updateObj[propertyName]) {
                    obj[propertyName] = updateObj[propertyName];
                }
                break;
        }
    }
}

function updateObjRef(realm: Realm, realmObj: Realm.Object, updateObj: {}, propertyName: string) {
    const oldTarget = realmObj[propertyName];
    const newTarget = updateObj[propertyName];

    // Get the name of primary key property for the target obj
    const prop = realmObj.objectSchema().properties[propertyName] as Realm.ObjectSchemaProperty;
    const pkeyName = realm.schema.find((s) => s.name === prop.objectType).primaryKey;

    // object references can be specified via their primary key
    // If this is the case we may need to apply them in a second phase
    // (since the target object may not exist yet)
    if (typeof newTarget === 'string') {
        if (pkeyName === undefined) {
            throw new Error('links can only be strings if target has primary key');
        }

        // Are we already linking to target?
        if (oldTarget !== null && oldTarget[pkeyName] === newTarget) {
            return;
        }

        // Check if target obj already exists
        const obj = realm.objectForPrimaryKey(prop.objectType, newTarget);
        if (obj !== undefined) {
            realmObj[propertyName] = obj;
            return;
        }

        // else we need a second pass
        //needSecondPhase = true;

        return;
    }

    if (typeof newTarget !== 'object' && newTarget !== null) {
        throw new Error('link property "' + propertyName.toString() + '" is not an object');
    }


    if (pkeyName === undefined) {
        if (newTarget === null) {
            if (oldTarget !== null) {
                deleteRecursive(realm, oldTarget);
            }
        }
        else {
            updateRecursive(realm, realmObj, propertyName, newTarget);
        }
    }
    else {
        if (newTarget === null) {
            if (oldTarget !== null) {
                realmObj[propertyName] = null;
            }
        }
        else {
            const targetObj = addOrUpdateObject(realm, prop.objectType, newTarget);
            if (oldTarget === null || oldTarget[pkeyName] !== newTarget[pkeyName]) {
                realmObj[propertyName] = targetObj;
            }
        }
    }
}

function updateListRefs(realm: Realm, realmList: Realm.List<any>, updateObjs: (string|{})[], typeName: string) {
    if (realmList.type !== 'object') {
        throw new Error('updates on lists of literals not supported yet');
    }

    // Get the name of primary key property for the target objs
    const pkeyName = realm.schema.find((s) => s.name === typeName).primaryKey;

    if (pkeyName === undefined) {
        throw new Error('updates only supported on lists of objects with primary keys');
    }

    // First clear all the old references (this will not delete the referenced objects)
    realm.delete(realmList);

    // Then add the new objects
    for (let i = 0; i < updateObjs.length; i++) {
        const upd = updateObjs[i];

        if (typeof upd === 'string') {
            // Check if target obj already exists
            const obj = realm.objectForPrimaryKey(typeName, upd);
            if (obj === undefined) {
                throw new Error('Could not find object to match type: ' + typeName + ' primaryKey: ' + upd);
            }

            realmList.push(obj);
        }
        else {
            const obj = addOrUpdateObject(realm, typeName, upd);
            realmList.push(obj);
        }
    }
}

