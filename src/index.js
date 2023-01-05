require('dotenv').config()
console.log(process.env)
if(process.env.EMULATOR=="true"){
  console.log("Running in emulator mode -============")
}
const configs = require("./config/config-manager");
const { Display } = require("./display/display.js");
const display = new Display();
display.initBroker()
