const Wall = require('./wall/wall')
const WallBroker = require('./wall/wall-broker')
const wall = new Wall()
const wallBroker = new WallBroker({
  wall: wall,
  wallBrokerConfig: require('./config/config.udp')
})
wallBroker.initSockets()