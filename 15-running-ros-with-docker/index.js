"use strict";
exports.__esModule = true;
var realm_object_server_1 = require("realm-object-server");
var path = require("path");
const { GraphQLService } = require("realm-graphql-service");

var server = new realm_object_server_1.BasicServer();

server.addService(new GraphQLService({
    // Turn this off in production!
    disableAuthentication: true
}));

server.start({
    // For all the full list of configuration parameters see:
    // https://realm.io/docs/realm-object-server/latest/api/ros/interfaces/serverconfig.html
    // This is the location where ROS will store its runtime data
    dataPath: path.join(__dirname, '../data'),
    // A logger to pipe ROS information. You can also specify the log level.
    // The log level can be one of: all, trace, debug, detail, info, warn, error, fatal, off.
    logger: new realm_object_server_1.FileConsoleLogger(path.join(__dirname, '../log.txt'), 'all', {
        file: {
            timestamp: true,
            level: 'debug'
        },
        console: {
            level: 'info'
        }
    }),
    // The feature token acquired from Realm. This must be set to a valid token
    // string to start the server. Please note that "Developer Edition" was
    // phased out in March 2018. Free-tier users are encouraged to move to Realm
    // Cloud (see https://cloud.realm.io for more information).
    //featureToken: '<INSERT_FEATURE_TOKEN>'
    featureToken: '<INSERT_TOKEN_HERE>'
})
    .then(function () {
    console.log("Realm Object Server was started on " + server.address);
})["catch"](function (err) {
    console.error("Error starting Realm Object Server: " + err.message);
});
