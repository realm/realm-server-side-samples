# Kafka Consumer

This is a configurable Kafka Consumer for Realm. It can handle any type of Kafka stream, you only have to supply a mapping function that converts the Kafka message into a standard `Update` format. The consumer will then handle consuming the stream of messages and integrating the data into the target realm, handling both merging and cleanup of unused objects automatically.

Top level objects need primary keys to be indentifiable, but sub-objects are handled even if they do not have primary keys (so it can handle hierarchical groups of objects like in JSON documents).

## How to build

You need to have `npm` and `typescript` installed.

First install the dependencies:

```bash
$ npm install
```

Then you can compile the typescript code:

```bash
$ tsc
```

## Running the sample

There is a sample under `samples`. The sample shows how to setup a naive mapper that can handle any Kafka messaage and just store it as a new object.

After compiling the typescript you can run it with:

```bash
$ node built/samples/sample-consumer.js
```

## How to use

Take a look at the sample consumer and then modify `template.ts` to build your own version.





