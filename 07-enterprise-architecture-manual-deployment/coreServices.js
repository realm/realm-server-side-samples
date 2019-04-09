const ros = require('realm-object-server');
const rose = require('realm-object-server-enterprise');
const path = require('path');


const server = new ros.BasicServer();
const logLevel = 'debug';

const port = process.env.PORT || 9080;

const discovery = new rose.ConsulDiscovery({
    consulHost: process.env.CONSUL_HOST || '172.20.20.11', // change this to the Consul cluster load balancer address. Can be DNS name.
    consulPort: process.env.CONSUL_PORT || '8500',
    advertiseAddress: '172.20.20.10', // Should be IP/DNS of CoreServices or NAT IP if behind an LB/NAT
    advertisePortMap: {
        [port]: 9080 // change '9080' to the external port if behind a NAT
    },
    logger: new ros.FileConsoleLogger(path.join(__dirname, '../consul-log.txt'), 'all', {
        file: {
            timestamp: true,
            level: logLevel
        },
        console: {
            level: logLevel
        }
    })
});

const authService = new ros.AuthService();
authService.addProvider(new ros.auth.PasswordAuthProvider({autoCreateAdminUser: true}));

const startConfig = {
    services: [
        new ros.SyncProxyService(),
        authService,
        new ros.RealmDirectoryService(),
        new ros.PermissionsService(),
        new ros.LogService(),
        new ros.HealthService(),
        new ros.WelcomeService(),
        // new ros.GraphQLService() //Uncomment if you'd like to use Realm GraphQL
    ],
    dataPath: path.join(__dirname, 'data'),
    discovery,
    port,
    privateKeyPath: path.join(__dirname, 'data/keys/auth.key'),
    publicKeyPath: path.join(__dirname, 'data/keys/auth.pub'),
    logger: new ros.FileConsoleLogger(path.join(__dirname, '../core-svc-log.txt'), 'all', {
        file: {
            timestamp: true,
            level: logLevel
        },
        console: {
            level: logLevel
        }
    })
};

server.start(startConfig).then(() => {
    console.log(`Your server is started at ${server.address}`);
})
.catch(err => {
    console.error('There was an error starting your server');
    console.error(err);
});