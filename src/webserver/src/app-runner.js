/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/



var AnypixelApp = require('./anypixel-app');
let ws = null;
function showMessage(message){
  console.log(message)
}
function connect() {
  if (ws) {
    ws.onerror = ws.onopen = ws.onclose = null;
    ws.close();
  }

  ws = new WebSocket(`ws://${location.host}`);

  ws.binaryType = 'arraybuffer';
  ws.onerror = function () {
    showMessage("WebSocket error");
  };
  ws.onopen = function () {
    showMessage("WebSocket connection established");
    AnypixelApp.setWS(ws)
  };
  ws.onclose = function () {
    showMessage("WebSocket connection closed");
    ws = null;
    setTimeout(connect, 100)
  };
  ws.onmessage = (event)=>{
    // console.log(new Uint8Array(event.data), event.type)
    console.log(event.data)
    AnypixelApp.receiveMessage(event)
    // parsePacket(event.data)
  }
}
connect()


/**
 * Functions for running the update loop for the current Anypixel app
 */
var AppRunner = module.exports = {};

AppRunner.canvasId = 'button-canvas';

AppRunner.ws = ws
document.addEventListener('DOMContentLoaded', function() {
  console.log('App Runner: Init');

  // Listen for messages sent by the Chrome App
  window.addEventListener('message', AnypixelApp.receiveMessage);

  setTimeout(function() {
    AnypixelApp.setCanvas(AppRunner.canvasId);
  }, 25);

  setTimeout(function() {
    console.log("setting ready.")
    
    AnypixelApp.setReady()
  }, 1000);

  // Start sampling canvas data
  var sampleInterval = null;
  document.addEventListener('buttonWallReady', function() {
    console.log('App Runner: Button wall ready');
    sampleInterval = setInterval(function() {
      AnypixelApp.updateFrame();
    }, 17); // 1 / 60fps ≈ 17ms
  });

  // Clean up: clear the sampler interval
  window.addEventListener('beforeunload', function() {
    console.log('App Runner: Cleaning up...');
    if (sampleInterval) {
      clearInterval(sampleInterval);
    }
  });
}, false);