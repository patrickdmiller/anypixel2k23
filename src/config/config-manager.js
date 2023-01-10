
fs = require("fs");
path = require("path")
const userDefinedPath = "./user-defined";
const configKeys = {
  DISPLAY: "DISPLAY", //display units , pixels, number per unit, etc
  DISPLAY_ADDRESSING: "DISPLAY_ADDRESSING", //ports and addresses per unit
  POWER: "POWER", //power supply info
  BROKER: "BROKER", //comm broker
  WEBSERVER: 'WEBSERVER', //webserver that runs apps in chrome
  GUMBAND:'GUMBAND'
};
if(process.env.EMULATOR == "true"){
  configKeys.DISPLAY_ADDRESSING = "EMULATOR"
}

const configs = {};
for (const key in configKeys) {
  configs[key] = {
    isSet: false,
    configObject: null,
  };
}

function isValidConfigKey(configKey) {
  if (!(configKey in configKeys)) {
    throw new Error("invalid config key", configKey);
  }
}

const configManager = {
  getConfig: (configKey) => {
    isValidConfigKey(configKey);
    if (!configs[configKey].isSet) {
      throw new Error(`config ${configKey} not set. Please call setConfig before getConfig for it`);
    }
    return configs[configKey].configObject;
  },

  //TODO, for now just set to defaults and override with user-defined folder
  setConfig: ({ configKey, configObject }) => {

  },

  setConfigToDefault: () => {
    for (const configKey in configKeys) {
      let fileKey = configKeys[configKey]

      configs[configKey].isSet = true;
      
      if (fs.existsSync(path.join(__dirname, userDefinedPath,`config.${fileKey}.js`))){

        let userdefined = require(path.join(__dirname, userDefinedPath,`config.${fileKey}.js`))
        configs[configKey].configObject = userdefined
      }
      else{
        configs[configKey].configObject = require(`./defaults/config.${fileKey}.js`);
      }
    }

    //now add derived config based on config object
    for (const configKey in configKeys) {
      let fileKey = configKeys[configKey]
      //check if extra functions
      if (fs.existsSync(path.join(__dirname, 'computed',`computed.${fileKey}.js`))){
      // if (fs.existsSync(`./config/computed/computed.${fileKey}.js`)) {
        console.log(configKey, "has computed")
        require(path.join(__dirname, 'computed',`computed.${fileKey}.js`))(configs, configs[configKey].configObject)
        // configs[configKey].configObject = {...configs[configKey].configObject, ...computed}
      }else{
        console.log("no", path.join(__dirname, 'computed',`computed.${fileKey}.js`))
      }
    }
  },
};

configManager.setConfigToDefault();
module.exports = configManager
