//set up configuration

const configs = require('./config/config-manager')

configs.setConfig({configKey:'POWER', configObject:{
  bleh:'blee'
}})

const Wall = require('./wall/wall')
const WallBroker = require('./wall/wall-broker')





const wall = new Wall()

const wallBroker = new WallBroker({
  wall: wall,
  wallBrokerConfig: require('./config/config.udp')
})
wallBroker.initSockets()