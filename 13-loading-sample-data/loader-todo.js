const faker = require('faker')
const Realm = require('realm')
const fs = require('fs')
const uuidv1 = require('uuid/v1');
var randomWords = require('random-words');

var totalitems = 10

//insert the your connection information  
//for self-hosting: 'http:<ip_address>:port' 
//for cloud: 'http:<instance_address>'
const URL = 'https://<server_url>';
const username = 'USERNAME';
const password = 'PASSWORD';
const myProjectName = 'Task List'

const Item = {
    name: 'Item',
    primaryKey: 'itemId',
    properties: {
      itemId: 'string',
      body: 'string',
      isDone: 'bool',
      timestamp: 'date'
    }
  }

const Project = {
    name: 'Project',
    primaryKey: 'projectId',
    properties: {
      projectId: 'string',
      owner: 'string',
      name: 'string',
      timestamp: 'date',
      items: 'Item[]'
    }
  }

const errorCallback = function errorCallback(message, isFatal, category, code) {
    console.log(`Message: ${message} - isFatal: ${isFatal} - category: ${category} - code: ${code}`)
}


Realm.Sync.User.login(`${URL}`, username, password)
.then((user) => {
      let config = user.createConfiguration();
      config.schema = [Item, Project];
      Realm.open(config)
        .then((realm) => {
            let itemResults = realm.objects('Item');
            if (itemResults.length < totalitems) {
                //write to the realm
                realm.write(() => {
                    //create a project 
                    var project = realm.create('Project', {          
                    projectId: uuidv1(),
                    owner: user.identity,
                    name: myProjectName,
                    timestamp: new Date(),
                    items: []
                        }, true)
                    //create the tasks
                    for (let index = 0; index < totalitems; index++) {
                        var newItem = realm.create('Item', {
                            itemId: uuidv1(),
                            body: randomWords(),
                            isDone: false,
                            timestamp: new Date()
                        }, true)
                        project.items.push(newItem)
                    }
                })
            }
            realm.close()
        })
});
