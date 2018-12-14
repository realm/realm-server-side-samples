# 12. Dequeueing Messages

The aim of this exercise is to create a basic test application that follows the dequeuer architecture pattern for the Realm Platform. Upon completion, you will be able to write a message to Apache Kafka, consume the message via node.js, and respond to this consumed message by creating a new object in the Realm Object Server.

## Prerequisites 

* Realm Object Server 2.x \(or higher\) or Realm Cloud
* An admin user for your object server or cloud instance. The username and password will be used in step 4

Looking to get started right away?  You can find our code [here](https://github.com/realm/realm-server-side-samples/tree/master/12-kafka-integration), but you'll still need your own Kafka server.  Follow steps 1-3 below to do that!  

## **Step 1: Download Kafka** <a id="step-1-download-kafka"></a>

The syntax of the terminal commands assumes you are working in a Linux environment.

[Download](https://www.apache.org/dyn/closer.cgi?path=/kafka/0.11.0.1/kafka_2.11-0.11.0.1.tgz) the 1.1.0 release and un-tar it

```bash
#you may need to install wget if you don't already have it
ubuntu@kafka-server:~$ wget http://apache.mirrors.pair.com/kafka/1.1.0/kafka_2.12-1.1.0.tgz

ubuntu@kafka-server:~$ tar -xzf kafka_2.12-1.1.0.tgz

ubuntu@kafka-server:~$ cd kafka_2.12-1.1.0
```

## **Step 2: Start the Server** <a id="step-2-start-the-server"></a>

The following section requires java to be installed. This can be done via the terminal with:

```bash
ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ sudo apt-get update

ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ sudo apt install default-jre -y
```

Kafka uses[ ZooKeeper](https://zookeeper.apache.org/), so you first need to start a ZooKeeper server. Kafka includes a script to get a quick single-node ZooKeeper instance running.

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ bin/zookeeper-server-start.sh config/zookeeper.properties &`

Now, start the Kafka server:

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ bin/kafka-server-start.sh config/server.properties &`

If you run receive the error: `Unrecognized VM option 'PrintGCDateStamps` see the issue and fix [here](https://issues.apache.org/jira/browse/KAFKA-6855).

## **Step 3: Create a topic** <a id="step-3-create-a-topic"></a>

In a new terminal window, create a Kafka topic

You can change the topic name to whatever you desire. We have chosen "kafkaTest"

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic kafkaTest`

You can print out all of your existing topics via the following command:

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ bin/kafka-topics.sh --list --zookeeper localhost:2181`

## **Step 4: Create a consumer that ingests Kafka and writes to ROS** <a id="step-4-create-a-consumer-that-ingests-kafka-and-writes-to-ros"></a>

Next, we need to create a Kafka consumer to take messages from the Kafka queue and write them to the ROS. We are going to do this via node.js.

This relies on `realm-js` and `kafka-node` npm packages being installed in the working directory. You will need to install npm:

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ sudo apt install npm -y`

Now we can install the dependencies for the consumer via npm. 

```bash
ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ npm install realm

ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ npm install kafka-node
```

You can find the code for our consumer in the repository

Within this code, you will need to edit a few things such as the ROS Address, your login credentials for Realm, and the name of your Kafka topic:

```javascript
//Params to edit
const ROS_Address      = 'INSERT_ROS_ADDRESS_HERE'; //i.e. "localhost:9080"
const username         = 'INSERT_USERNAME_HERE';    //i.e. "info@realm.io"
const password         = 'INSERT_PASSWORD_HERE';    //i.e. "password"
const realmPath        = 'INSERT_REALM_PATH_HERE';  //i.e. "/kafkaRealm"

const kafkaHost        = 'INSERT_ADDRESS_HERE';     //i.e. "localhost:2181"
const kafkaTopic       = 'INSERT_TOPIC_HERE';       //i.e. "kafkaTest"
```

Once you’ve done this, save the code as `consumer.js` to a convenient location on your Kafka server.

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ node consumer.js`

## **Step 5: Create a producer to send messages to Kafka** <a id="step-5-create-a-producer-to-send-messages-to-kafka"></a>

We first need to create a producer where we can generate messages for Kafka

You can do this via the terminal window with the following command:

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ bin/kafka-console-producer.sh --broker-list localhost:9092 --topic kafkaTest`

You can then just type messages into the terminal window to write them to your topic.  

You can find the code for our producer in the repository

This relies on `no-kafka` being installed in the working directory. If you are using the same directory as your consumer, this dependency was already installed.

The script will produce messages to kafka. You can change the content of these messages by changing the messageBuffer variable.

Once you are happy with the script, save it as producer.js on your Kafka server. It can then be run via the terminal with:

`ubuntu@kafka-server:~/kafka_2.11-0.11.0.1$ node producer.js`

**Step 6: View the results via Realm Studio**

Download and installation instructions for Realm Studio can be found here.


## Typescript Consumer

We have also developed a slightly more sophisticated version of the consumer using typescript.  You'll find the code in ts-consumer.ts 
You will need the necessary typescript dependencies to utilize this version/  

## UPDATE: 
The Realm team is in the process of creating a pre-built Kafka Connector.  If you're looking for more details or access, please shoot us an email at info@realm.io 