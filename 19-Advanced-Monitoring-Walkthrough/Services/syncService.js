const path = require('path');
const ros = require('realm-object-server');
const rose = require('realm-object-server-enterprise');
const os = require('os');

process.env.FEATURE_TOKEN = "" //Insert Feature Token 

function getIPv4Address(interfaceName) {
    return os.networkInterfaces()[interfaceName].filter(iface => iface.family === 'IPv4')[0].address;
}
const promClient = require('prom-client');

const registry = new promClient.Registry();
registry.setDefaultLabels({
    // every stats metric will have the 'hostname' label
    // so that metrics from different servers can be distinguished
    hostname: os.hostname()
});
const server = new ros.BasicServer();

const port = process.env.PORT || 9080; // This is a unique port for the server shell which coordinates the various services
const label = process.env.SYNC_LABEL || "default"; // This label needs to be unique for each group of sync-workers
const syncId = process.env.SYNC_ID || os.hostname(); // SYNC_ID must be unique for every sync-worker. We use the hostname here for convenience but takes a string
const syncPort = process.env.SYNC_PORT || 7800; // This is the port ROS Core Services will route Realm Sync Clients to
const privateKeyPath = path.join(__dirname, 'data/keys/auth.key');
const publicKeyPath = path.join(__dirname, 'data/keys/auth.pub');

const discovery = new rose.ConsulDiscovery({
    consulHost: process.env.CONSUL_HOST || "127.0.0.1",
    consulPort: process.env.CONSUL_PORT || "8500"
});

const startConfig = {
    services: [
        new ros.LogService(),
        new rose.services.MetricsService(registry),
        new rose.ReplicatedSyncService({
            consul: discovery.consul,
            dataPath: path.join(__dirname, 'data'),
            featureToken: process.env.FEATURE_TOKEN,
            id: syncId,
            label: label,
            listenAddress: getIPv4Address('eth0'),
            listenPort: Number(syncPort),
            maxDownloadSize: 16000000,
            enableDownloadLogCompaction: true,
            logLevel: "debug",
            publicKeyPath
        })
    ],
    statsStorage: new ros.stats.NullStatsStorage(),
    statsSink: new ros.stats.PrometheusStatsSink({registry}),
    privateKeyPath,
    publicKeyPath,
    address: getIPv4Address('eth0'),
    port,
    discovery,
    dataPath: path.join(__dirname, 'data'),
    logLevel: "debug"
};

server.start(startConfig).then(() => {
    console.log(`Your server is started at ${server.address}`);
})
.catch(err => {
    console.error('There was an error starting your server');
    console.error(err);
});