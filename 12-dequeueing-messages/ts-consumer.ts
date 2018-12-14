import * as Realm from 'realm';
import * as Kafka from 'kafka-node';

//Params to edit
const ROS_Address      = 'INSERT_ROS_ADDRESS_HERE'; // i.e. "localhost:9080"
const username         = 'INSERT_USERNAME_HERE';    // i.e. "info@realm.io"
const password         = 'INSERT_PASSWORD_HERE';    // i.e. "password"
const realmPath        = 'INSERT_REALM_PATH_HERE';  // i.e. "/kafkaRealm"

const kafkaHost        = 'INSERT_ADDRESS_HERE';     // i.e. "localhost:2181"
const kafkaTopic       = 'INSERT_TOPIC_HERE';       // i.e. "kafkaTest"
const kafkaPartition   = 0;                         // default to partition 0
const KafkaStartOffset = null;                      // null to start with latest, set to 0 to replay from start


class KafkaState {
    public static schema: Realm.ObjectSchema = {
        name: 'KafkaState',
        primaryKey: 'topic',
        properties: {
            topic:  'string',
            offset: { type: 'int', optional: true },
        }
    }

    public topic:   string;
    public offset?: number | null;
}

//TODO
//set the Schema of your object to be stored in ROS -- depends on Kafka message
class KafkaMsg {
    public static schema: Realm.ObjectSchema = {
        name: 'KafkaMsg',
        properties: {
            kTopic:     'string',
            kPartition: { type: 'int', default: 0 },
            kOffset:    { type: 'int', default: 0 },
            kMessage:   'string'
        }
    }

    public kTopic:     string;
    public kPartition: number;
    public kOffset:    number;
    public kMessage:   string;
}

function writeMsg(realm: Realm, state: KafkaState, message: Kafka.Message) {
    realm.write(() => {
        // Store the message itself. In an actual app you will probably want to do some
        // conversion here to fit content of the message to your intended data model.
        realm.create('KafkaMsg', {
            kTopic:     message.topic,
            kPartition: message.partition,
            kOffset:    message.offset,
            kMessage:   message.value.toString()
        });

        // Store offset of next message so we know where to start from if the app is restarted
        state.offset = message.offset + 1;
    });
}


async function main() {
    //Login to realm with admin access
    const user = await Realm.Sync.User.login("https://" + ROS_Address, username, password);
    console.log("Logged in user " + username);

    const realmURL = "realms://" + ROS_Address + realmPath;

    const realm = await Realm.open({
        schema: [KafkaState.schema, KafkaMsg.schema],
        sync: {
            user: user,
            url:  realmURL
        }
    });
    console.log("Opened Realm at " + realmURL);

    // Check if we have a stored offset or if this is the first run of the app
    let kafkaState = realm.objectForPrimaryKey<KafkaState>('KafkaState', kafkaTopic);
    if (kafkaState === undefined) {
        realm.write(() => {
            kafkaState = realm.create('KafkaState', {topic: kafkaTopic, offset: KafkaStartOffset}, true);
        });
    }

    // Create an instance of the Kafka consumer
    // If the offset is set to null, we will just start listening for new messages, otherwise we
    // will start from the specified offset
    const client   = new Kafka.Client(kafkaHost);
    const consumer = (kafkaState.offset === null)
                     ? new Kafka.Consumer(client, [{ topic: kafkaTopic, partition: kafkaPartition}], {})
                     : new Kafka.Consumer(client, [{ topic: kafkaTopic, partition: kafkaPartition, offset: kafkaState.offset}], {fromOffset: true});

    if (kafkaState.offset === null) {
        console.log("Waiting for new messages...");
    }
    else {
        console.log("Waiting for messages... Starting from offset " + kafkaState.offset);
    }

    consumer.on('message', function (message) {
        console.log(message);
        writeMsg(realm, kafkaState, message);
    });
}

main();
