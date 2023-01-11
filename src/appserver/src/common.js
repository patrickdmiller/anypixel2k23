
const APP_IDS = {
  STATIC: "static",
  BALLPIT: "ballpit",
  SQUISHY: "squishy",
}
const CONTROL_MESSAGE_KEYS = {
  CHANGE_APP:'CHANGE_APP'
}
const controlMessageGenerate = {
  message:({controlMessageKey, payload})=>{
    console.log("building packet", controlMessageKey, payload)
    let json = {
      TYPE:controlMessageKey, 
      payload,'hi2u':'helo'
    }
    return JSON.stringify(json)
  },
  changeApp : function(appID){
    if(!APP_IDS[appID]){
      throw new Error("invalid App")
    }

    return this.message({
      controlMessageKey:CONTROL_MESSAGE_KEYS.CHANGE_APP,
      payload:appID
    })
  }
}


module.exports = {
  controlMessageGenerate,
  APP_IDS,
  CONTROL_MESSAGE_KEYS
};
