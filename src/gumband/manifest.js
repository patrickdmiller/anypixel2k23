//generate a manifest
const fs = require("fs");
class Manifest {
  constructor() {
    this.statuses = [];
    this.statusesById = {};
  }

  addStatus = function ({ id, type, display, _default } = {}) {
    this.statuses.push({
      id,type,display,'default':_default
    })
  };

  toJSON = function () {
    let json = {};

    json.statuses = [];
    json.controls = [];
    json.settings = [];
    this.statuses.map((status) => {
      json.statuses.push(status);
    });
    return {manifest:json};
  };

  save = async function ({ file = "./manifest.json" }={}) {
    await fs.promises.writeFile(file, JSON.stringify(this.toJSON()));
  };
}

module.exports = {
  Manifest
}
