import * as Realm from 'realm';
import * as Kafka from 'kafka-node';
import {Update, applyUpdate} from './realm-merge';

export { Update };

process.on('unhandledRejection', error => {
    console.log('unhandledRejection:', error);
});


export interface KafkaConsumerSettings {
    instance:    string;     // i.e. "myinstance.cloud.realm.io"
    username:    string;     // i.e. "info@realm.io"
    password:    string;     // i.e. "password"
    realmPath:   string;     // i.e. "/kafkaRealm"
    schema?:     Realm.ObjectSchema[] | null; // schema for the target realm (can be null if realm already exists)

    kafkaHost:         string;  // i.e. "localhost:2181"
    kafkaTopic:        string;  // i.e. "kafkaTest"
    kafkaPartition?:   number;  // default to partition 0
    KafkaStartOffset?: number;  // null to start with latest, set to 0 to replay from start

    mapper(message: Kafka.Message): Update;
}

class KafkaState {
    public static schema: Realm.ObjectSchema = {
        name: '_KafkaState',
        primaryKey: 'topic',
        properties: {
            topic:  'string',
            offset: { type: 'int', optional: true },
        }
    }

    public topic:   string;
    public offset?: number | null;
}

export class KafkaConsumer {
    settings: KafkaConsumerSettings;

    constructor(settings: KafkaConsumerSettings) {
        this.settings = settings;

        // set defaults
        if (this.settings.kafkaPartition === undefined || this.settings.kafkaPartition === null) {
            this.settings.kafkaPartition = 0;
        }
    }

    async start() {
        const s = this.settings;

        //Login to realm with admin access
        const user = await Realm.Sync.User.login("https://" + s.instance, s.username, s.password);
        console.log("Logged in user " + s.username);

        const realmURL = "realms://" + s.instance + s.realmPath;

        let realm: Realm = null;

        if (this.settings.schema !== null && this.settings.schema !== undefined) {
            // Ensure that schema contains the kafka state
            const schema = this.settings.schema;
            const kStateSchema = schema.find((s) => s.name === '_KafkaState');
            if (kStateSchema === undefined) {
                schema.push(KafkaState.schema);
            }

            realm = await Realm.open({
                schema: schema,
                sync: {
                    user: user,
                    url:  realmURL
                }
            });
        }
        else {
            // first open realm to verify schema
            realm = await Realm.open({
                sync: {
                    user: user,
                    url:  realmURL
                }
            });

            // Ensure that schema contains the kafka state
            const schema = realm.schema;
            const kStateSchema = schema.find((s) => s.name === '_KafkaState');
            if (kStateSchema === undefined) {
                schema.push(KafkaState.schema);

                realm.close();
                realm = null;

                // Re-open realm with extended schema
                realm = await Realm.open({
                    schema: schema,
                    sync: {
                        user: user,
                        url:  realmURL
                    }
                });
            }
        }
        console.log("Opened Realm at " + realmURL);

        // Check if we have a stored offset or if this is the first run of the app
        let kafkaState = realm.objectForPrimaryKey<KafkaState>('_KafkaState', s.kafkaTopic);
        if (kafkaState === undefined) {
            realm.write(() => {
                kafkaState = realm.create('_KafkaState', {topic: s.kafkaTopic, offset: s.KafkaStartOffset}, true);
            });
        }

        // Create an instance of the Kafka consumer
        // If the offset is set to null, we will just start listening for new messages, otherwise we
        // will start from the specified offset
        const client   = new Kafka.Client(this.settings.kafkaHost);
        const consumer = (kafkaState.offset === null)
                        ? new Kafka.Consumer(client, [{ topic: s.kafkaTopic, partition: s.kafkaPartition}], {})
                        : new Kafka.Consumer(client, [{ topic: s.kafkaTopic, partition: s.kafkaPartition, offset: kafkaState.offset}], {fromOffset: true});

        if (kafkaState.offset === null) {
            console.log("Waiting for new messages...");
        }
        else {
            console.log("Waiting for messages... Starting from offset " + kafkaState.offset);
        }

        consumer.on('message', function (message) {
            console.log("Receiving msg:", message);
            this.handleMsg(realm, kafkaState, message);
        });
    }

    handleMsg(realm: Realm, state: KafkaState, message: Kafka.Message) {
        const update = this.settings.mapper(message);

        realm.write(() => {
            applyUpdate(realm, update);
    
            // Store offset of next message so we know where to start from if the app is restarted
            state.offset = message.offset + 1;
        });
    }
}
