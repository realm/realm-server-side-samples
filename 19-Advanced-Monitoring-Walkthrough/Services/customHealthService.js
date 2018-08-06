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