const startConfig = {
    services: [
        new rose.services.MetricsService(registry),
        //...
    ],
    statsStorage: new ros.stats.NullStatsStorage(),
    statsSink: new ros.stats.PrometheusStatsSink({registry}),
    address: getIPv4Address('eth0'),
    //...
    }  