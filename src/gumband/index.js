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
    this.gb = new Gumband(
      gbconfig.TOKEN,
      gbconfig.ID,
      path.join(__dirname, "../config/user-defined/manifest.json"),
      // optional parameters:
      {
        customServerIP: "192.168.3.91",
        endpoint: "custom",
        version: "v1",
        contentLocation: "./content",
      }
    );

    this.gb.on(Sockets.SETTING_RECEIVED, (payload) => {
      if (payload.id === "idle_timeout_secs") {
        logger.info(`New idle timeout: ${payload.value}`);
      }
      // if(payload)
      logger.info("setting", payload)
      // console.log(payload)
      if(payload && payload.id){
        logger.debug(Sockets.SETTING_RECEIVED,EVENTS_TO_FORWARD[Sockets.SETTING_RECEIVED])
        if(EVENTS_TO_FORWARD[Sockets.SETTING_RECEIVED].has(payload.id )){
          this.emit(payload.id, payload)
        }else{
          logger.warn("not forwarding")
        }
        switch(payload.id){
          case 'APP_ID':
            this.emit('APP_ID', payload)
        }
      }
      // this.e;
    });

    this.gb.on(Sockets.READY, async()=>{
      let settings = await this.gb.getAllSettings()
      console.log("starting with settings", settings)
      for(const settingID in settings){
        if(EVENTS_TO_FORWARD[Sockets.SETTING_RECEIVED].has(settingID)){
          this.emit(settingID,{value:settings[settingID].value} )
        }
      }
      

    })
  }
}

module.exports = {
  GumbandExhibit,
  GumbandSockets:Sockets
};
