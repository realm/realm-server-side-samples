import {KafkaConsumer, KafkaConsumerSettings, Update} from '../src/kafka-consumer';
import * as Kafka from 'kafka-node';

// Define mappoing function
function mapToRealm(message: Kafka.Message): Update {
    const update: Update = {
        updated: {
        },
        deleted: {
        }
    }

    return update;
}

// Set settings
const settings: KafkaConsumerSettings = {
    instance:   'myinstance.cloud.realm.io',
    username:   'test_admin',
    password:   'test',
    realmPath:  '/kafkaRealm',
    schema:     null, // no schema needed if realm already exist

    kafkaHost:  'localhost:2181',
    kafkaTopic: 'topic1',
    kafkaPartition:   0,
    KafkaStartOffset: 0,

    mapper: mapToRealm
}

// Start the consumer
console.log("Starting sample consumer");
const consumer = new KafkaConsumer(settings);
consumer.start();