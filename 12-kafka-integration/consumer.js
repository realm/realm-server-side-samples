//set requirements
const Kafka = require('no-kafka');
var Realm = require('realm');
var fs = require('fs');

//Params to edit
var ROS_Address = 'INSERT_ROS_ADDRESS_HERE' //i.e. http://localhost:9080/
var username = 'INSERT_USERNAME_HERE'; //i.e. info@realm.io
var password = 'INSERT_PASSWORD_HERE'; //i.e. password
var kafkaTopic = 'INSERT_TOPIC_HERE'; //i.e. kafkaTest
let realmURL = 'INSERT_REALM_URL_HERE'; //i.e. realm://localhost:9080/kafkaRealm

Realm.Sync.setFeatureToken(token);

//TODO
//set the Schema of your object to be stored in ROS -- depends on Kafka message
const kafkaSchema = {
    name: 'kafka',
    properties: {
        kTopic: 'string',
        kPartition: { type: 'int', default: 0 },
        kOffset: { type: 'int', default: 0 },
        kMessage: 'string'
    }
};

function loginWrite(topic, partition, offset, message) {
    //Login to realm with admin access
    Realm.Sync.User.login(ROS_Address, username, password).then(user => {
        Realm.open({
            schema: [kafkaSchema],
            sync: {
                user: user,
                url: realmURL
            }
        }).then(realm => {
            realm.write(() => {
                let user = realm.create('kafka', {
                    kTopic: topic,
                    kPartition: partition,
                    kOffset: offset,
                    kMessage: message
                });
            })
        }).catch(error => {
            console.log('Error Opening Realm=' + error);
            return;
        });
    }).catch(error => {
        console.log('Error Logging into ROS=' + error);
        return;
    });
}

// KAFKA
// Create an instance of the Kafka consumer
const consumer = new Kafka.SimpleConsumer
var data = function(messageSet, topic, partition) {
    messageSet.forEach(function(m) {
        console.log(topic, partition, m.offset, m.message.value.toString('utf8'));
        loginWrite(topic, partition, m.offset, m.message.value.toString('utf8'));
    });
};

// Subscribe to the Kafka topic
return consumer.init().then(function() {
    //aEnter the name of your Kafka topic below
    return consumer.subscribe(kafkaTopic, data);

});