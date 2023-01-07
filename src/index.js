require('dotenv').config()


if(process.env.EMULATOR=="true"){
  console.log("Running in emulator mode -============")
}
const configs = require("./config/config-manager");
const { Display, DisplayEvents } = require("./display/display.js");
const {AppBroker} = require('./apps/app-broker')
const {Webserver} = require('./webserver/webserver')

const display = new Display();
webserver = new Webserver();
appBroker = new AppBroker({webserver})
webserver.init()

//when buttons aka inputs change state, end them to the app broker
display.on(DisplayEvents['STATE_INPUT'], (globalStateChanges)=>{
  // console.log(globalStateChanges)
  //tell the appbroker that state has changed
  appBroker.updateInputState(globalStateChanges)
})

display.initBroker()
