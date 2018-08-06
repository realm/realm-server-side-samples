const promClient = require('prom-client');
const os = require('os');

const registry = new promClient.Registry();
registry.setDefaultLabels({
    // every stats metric will have the 'hostname' label
    // so that metrics from different servers can be distinguished
    hostname: os.hostname()
});