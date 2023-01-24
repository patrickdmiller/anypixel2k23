require("dotenv").config();
const EventEmitter = require("events");
const path = require("path");
const logger = require("node-color-log");
const configs = require("../config/config-manager");
const gbconfig = configs.getConfig("GUMBAND");
const { Gumband, Sockets } = require("@deeplocal/gumband-node-sdk");
// const manifest =


const EVENTS_TO_FORWARD = {
  SETTING_RECEIVED: new Set(['APP_ID'])
}

class GumbandExhibit extends EventEmitter {
  constructor() {
    super();
    this.ready = false
    this.gb = new Gumband(
      gbconfig.TOKEN,
      gbconfig.ID,
      path.join(__dirname, "../config/user-defined/manifest.json"),
      // optional parameters:
      gbconfig.CONNECTION_OBJECT
      // {
      //   endpoint: "dev",
      //   version: "v1",
      //   contentLocation: "./content",
      // }
    );
    this.gb.on(Sockets.CONTROL_RECEIVED, (payload)=>{
      console.log(payload.id)
      if(payload.id == 'RELOAD_BACKEND'){
        setTimeout(function () {
          process.on("exit", function () {
              require("child_process").spawn(process.argv.shift(), process.argv, {
                  cwd: process.cwd(),
                  detached : true,
                  stdio: "inherit"
              });
          });
          process.exit();
      }, 1000);
      }
      this.emit(payload.id, payload)
    })
    this.gb.on(Sockets.SETTING_RECEIVED, (payload) => {
      if (payload.id === "idle_timeout_secs") {
        logger.info(`New idle timeout: ${payload.value}`);
      }
      logger.info("setting", payload)
      if(payload && payload.id){
        logger.debug(Sockets.SETTING_RECEIVED,EVENTS_TO_FORWARD[Sockets.SETTING_RECEIVED])
        if(EVENTS_TO_FORWARD[Sockets.SETTING_RECEIVED].has(payload.id )){
          this.emit(payload.id, payload)
        }else{
          logger.warn("not forwarding")
        }
        switch(payload.id){
          
          case 'APP_ID':
            logger.debug("forwarding ", payload)
            this.emit('APP_ID', payload)
        }
      }
    });

    this.gb.on(Sockets.READY, async()=>{
      logger.warn("HERE")
      this.ready = true
      let settings = await this.gb.getAllSettings()
      console.log("starting with settings", settings)
      for(const settingID in settings){
        //this is when i connect, i need to forward all this stuff
        if(EVENTS_TO_FORWARD[Sockets.SETTING_RECEIVED].has(settingID)){
          this.emit(settingID,{value:settings[settingID].value} )
        }
      }
    })
  }

  sendPowerUnitStatus(powerUnitStatus){ 
    if(this.ready){
      this.gb.setStatus(`PS${powerUnitStatus.unitNumber}`, JSON.stringify(powerUnitStatus.status))
    }else{
      console.log("not ready")
    }
  }

  sendDisplayOnlineStatus(status){ 
    if(this.ready){
      this.gb.setStatus(`DISPLAY_CONNECTED`, JSON.stringify(status))
    }else{
      console.log("not ready")
    }
  }
}

module.exports = {
  GumbandExhibit,
  GumbandSockets:Sockets
};
