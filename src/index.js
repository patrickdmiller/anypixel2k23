require('dotenv').config()


if(process.env.EMULATOR=="true"){
  console.log("Running in emulator mode -============")
}
const configs = require("./config/config-manager");
const { Display, DisplayEvents } = require("./display/display.js");
const {Webserver:AppServer, WebserverEvents} = require('./webserver/webserver')

const display = new Display();
appServer = new AppServer();
// appBroker = new AppBroker({appserver})
appServer.init()

//when buttons aka inputs change state, end them to the app broker
display.on(DisplayEvents['STATE_INPUT'], (globalStateChanges)=>{
  appServer.updateInputState(globalStateChanges)
})

//when pixels are updated
appServer.on(WebserverEvents['STATE'], (pixelData)=>{
  display.pixelMessageHandler(pixelData)
})