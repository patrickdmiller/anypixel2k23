const configKeys = {
  DISPLAY:'DISPLAY', //display units , pixels, number per unit, etc
  DISPLAY_ADDRESSING:'DISPLAY_ADDRESSING', //ports and addresses per unit
  POWER:'POWER', //power supply info
  BROKER:'BROKER' //comm broker 
};
const configs = {};
for(const key in configKeys){
  configs[key] = {
    isSet:false,
    configObject:null
  }
}

function isValidConfigKey(configKey){
  if(!(configKey in configKeys)){
    throw new Error("invalid config key", configKey)
  }
}
module.exports = {
  getConfig: (configKey) => {
    isValidConfigKey(configKey)
    if(!configs[configKey].isSet){
      throw new Error(`config ${configKey} not set. Please call setConfig before getConfig for it`)
    }
    return configs[configKey].configObject
  },

  setConfig: ({configKey, configObject})=>{
    isValidConfigKey(configKey)
    configs[configKey].configObject = configObject
    configs[configKey].isSet = true
  },

  setConfigToDefault: () => {},
};
