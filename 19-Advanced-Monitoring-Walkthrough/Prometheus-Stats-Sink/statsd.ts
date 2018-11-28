import { stats, BasicServer } from "realm-object-server";

const sink = new stats.StatsdStatsSink({
  hostname: 'statsd-host',
  port: 8125,
  socketType: 'udp4',
  logger: undefined // or a Logger instance
});

const server = new BasicServer();
server.start({
  statsSink: sink,
  statsStorage: new stats.NullStatsStorage()
});
