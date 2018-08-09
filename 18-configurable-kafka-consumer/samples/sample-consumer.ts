import {KafkaConsumer, KafkaConsumerSettings, Update} from '../src/kafka-consumer';
import * as Kafka from 'kafka-node';

// Define schema for target realm
// This is only needed if the realm does not exist when the consumer is started.
const msgSchema: Realm.ObjectSchema = {
    name: 'KafkaMsg',
    primaryKey: 'kOffset',
    properties: {
        kTopic:     'string',
        kPartition: { type: 'int', default: 0 },
        kOffset:    'string',
        kMessage:   'string'
    }
};

// Define mappoing function
function mapMsgToRealm(message: Kafka.Message): Update {
    // This is a naive example that just inserts a new object for each message
    const update: Update = {
        updated: {
            'KafkaMsg': [
                {
                    kTopic:     message.topic,
                    kPartition: message.partition,
                    kOffset:    message.offset.toString(),
                    kMessage:   message.value
                }
            ]
        }
    }

    return update;
}

// Set settings
const settings: KafkaConsumerSettings = {
    instance:   'alexander.us1.cloud.realm.io',
    username:   'test_admin',
    password:   'test',
    realmPath:  '/kafkaMsgRealm',
    schema:     [msgSchema],
    useSSL:     true,

    kafkaHost:  'localhost:2181',
    kafkaTopic: 'topic1',
    kafkaPartition: 0,
    KafkaStartOffset: null, // 'null' means start from latest

    mapper: mapMsgToRealm
}

// Start the consumer
console.log("Starting sample consumer");
const consumer = new KafkaConsumer(settings);
consumer.start();