const ros = require('realm-object-server');
const rose = require('realm-object-server-enterprise');
const path = require('path');
 const { GraphQLService } = require("realm-graphql-service"); //Uncomment if you'd like to use Realm GraphQL

const server = new ros.BasicServer();
const logLevel = 'debug';

const port = process.env.PORT || 9080;
// Start - CustomHealthService Health Service Changes

class CustomHealthService {
    onServiceStart(server) {
        this.version = server.version;
        this.healthClient = server.healthClient;
        this.syncServiceWatcher = server.discovery.watchService("sync", ["role=master", "label=default"]);
        this.syncServiceWatcher.on('available', () => this.hasSyncService = true);
        this.syncServiceWatcher.on('unavailable', () => this.hasSyncService = false);
    }

    onServerStart() {
        this.started = true;
    }

    getHealth(res, thisInstance) {
        function sendSuccess() {
            res.status(200).json({ version: server.version, "status": "UP" });
        }

        function sendFailure() {
            res.status(503).json({ version: server.version, "status": "DOWN" });
        }

        if (this.started) {
            // If thisInstnace is true, we're only interested in whether this ROS instance
            // has started. Otherwise, call into other instances to check their status.
            if (thisInstance === 'true') {
                sendSuccess();
            } else {
                return this.healthClient.hasServerStarted().then(result => {
                    if (result && this.hasSyncService) {
                        sendSuccess();
                    } else {
                        sendFailure();
                    }
                });
            }
        } else {
            sendFailure();
        }
    }

}
ros.BaseRoute("/health")(CustomHealthService);
ros.ServiceName("health")(CustomHealthService);
ros.Cors("/")(CustomHealthService);

ros.Start()(CustomHealthService.prototype,
            CustomHealthService.prototype.onServiceStart.name,
            null);

ros.ServerStarted()(CustomHealthService.prototype,
                    CustomHealthService.prototype.onServerStart.name,
                    null);

ros.Get("/")(CustomHealthService.prototype,
             CustomHealthService.prototype.getHealth.name,
             null);
ros.Response()(CustomHealthService.prototype,
               CustomHealthService.prototype.getHealth.name,
               0);
ros.Query("thisInstance")(CustomHealthService.prototype,
                          CustomHealthService.prototype.getHealth.name,
                          1);

//End - CustomHealthService Health Service Changes

const discovery = new rose.ConsulDiscovery({
    consulHost: process.env.CONSUL_HOST || '10.237.244.116', // change this to the Consul cluster load balancer address. Can be DNS name.
    consulPort: process.env.CONSUL_PORT || '8500',
    advertiseAddress: '10.47.180.164', // change this to the external URL or IP if behind NAT
    advertisePortMap: {
        [port]: 9080 // change '9080' to the external port if behind a NAT
    },
    logger: new ros.ConsoleLogger(logLevel)
});

const authService = new ros.AuthService();
authService.addProvider(new ros.auth.PasswordAuthProvider());
authService.addProvider(new ros.auth.NicknameAuthProvider());

const startConfig = {
    services: [
        new ros.SyncProxyService(),
        authService,
   //     new ros.RealmDirectoryService(),
        new ros.PermissionsService(),
        new ros.LogService(),
//        new ros.HealthService(),
        new CustomHealthService(),
        new ros.WelcomeService(),
//        new GraphQLService({ disableAuthentication: true }) //Uncomment if you'd like to use Realm GraphQL
    ],
    dataPath: path.join(__dirname, 'data'),
    discovery,
    port,
    logLevel,
    privateKeyPath: path.join(__dirname, 'auth.key'),
    publicKeyPath: path.join(__dirname, 'auth.pub')
};

server.start(startConfig).then(() => {
    console.log(`Your server is started at ${server.address}`);
})
.catch(err => {
    console.error('There was an error starting your server');
    console.error(err);
});