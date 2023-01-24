const {APP_IDS} = require('../../config/user-defined/constants')
const CONTROL_MESSAGE_KEYS = {
  CHANGE_APP: "CHANGE_APP",
  GET_STATUS:"GET_STATUS",
  RELOAD_APP:"RELOAD_APP"
};
const controlMessageGenerate = {
  message: ({ controlMessageKey, payload }) => {
    console.log("building packet", controlMessageKey, payload);
    let json = {
      TYPE: controlMessageKey,
      payload,
    };
    return JSON.stringify(json);
  },
  changeApp: function (appID) {
    if (!APP_IDS[appID]) {
      throw new Error("invalid App");
    }

    return this.message({
      controlMessageKey: CONTROL_MESSAGE_KEYS.CHANGE_APP,
      payload: appID,
    });
  },

  reloadApp: function () {
    return this.message({
      controlMessageKey: CONTROL_MESSAGE_KEYS.RELOAD_APP
    });
  },
};

module.exports = {
  controlMessageGenerate,
  CONTROL_MESSAGE_KEYS,
};
