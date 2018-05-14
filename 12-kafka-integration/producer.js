var Kafka = require('no-kafka');
var kafkaTopic = 'kafkaTest';

var producer = new Kafka.Producer();

var messageBuffer = ["msg1","msg2","msg3"];



return producer.init().then(messageBuffer.forEach(function(index){
  return producer.send({
      topic: kafkaTopic,
      partition: 0,
      message: {
          value: index
      }
  });
}))
.then(function (result) {

	//i just changed this line to be more positive of the outcome
	console.log("mission complete");
});