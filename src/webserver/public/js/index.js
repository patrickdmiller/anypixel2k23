(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

/**
 * Functions for managing communications between the current Anypixel app and ChromeBridge. This 
 * handles sending the canvas pixel data to ChromeBridge, and deals with messages sent from
 * ChromeBridge.
 */
var AnypixelApp = module.exports = {};

AnypixelApp.isReady = false;

AnypixelApp.appWindow = null;

AnypixelApp.appOrigin = null;

AnypixelApp.context = null;

AnypixelApp.canvas = null;

AnypixelApp.Events = {
  Ready       : 'buttonWallReady',
  ButtonStates: 'buttonStates',
};

/**
 * Sets the canvas to an element with a given id
 */
AnypixelApp.setCanvas = function(canvasId) {
  AnypixelApp.canvas = document.getElementById(canvasId);
  AnypixelApp.context = AnypixelApp.canvas.getContext('2d') || AnypixelApp.canvas.getContext('webgl');
};

AnypixelApp.setWS = function(ws){
  AnypixelApp.ws = ws
}

AnypixelApp.setReady = function(){
  AnypixelApp.isReady = true;
    // AnypixelApp.appWindow = event.source;
    // AnypixelApp.appOrigin = event.origin;

    // Send the ready event
    document.dispatchEvent(new Event(AnypixelApp.Events.Ready));
}
/**
 * Listener for message received events. Parses incoming messages into js events and dispatches them.
 */

AnypixelApp.receiveMessage = function(event) {
  // If first message, dispatch the ready event
  if (!AnypixelApp.isReady) {
    console.log('Opened communication with the Chrome app.');

    // Save app parameters
    AnypixelApp.isReady = true;
    AnypixelApp.appWindow = event.source;
    AnypixelApp.appOrigin = event.origin;

    // Send the ready event
    document.dispatchEvent(new Event(AnypixelApp.Events.Ready));
  } else {
    // Parse message
    if (event && event.data) {
      var data8v = new Uint8Array(event.data);
      // Check message type
      var message_type = data8v[0];

      // Case: Button states
      if (message_type == 0) {
        // Parse button states and dispatch event with updates
        var buttonStates = [];
        for (var i = 1; i < data8v.length; i++) { // Skip first byte (header)
          var buttonData = {
            p: {
              y: data8v[i++],
              x: data8v[i++]
            },
            s: data8v[i]
          }

          buttonStates.push(buttonData);         
        }

        document.dispatchEvent(new CustomEvent(AnypixelApp.Events.ButtonStates, {
          'detail': buttonStates
        }));
      }
    }
  }
};

/**
 * Grabs the pixels from the canvas and sends them to the ChromeBridge app via postMessage()
 */
AnypixelApp.updateFrame = function() {
  // Verify that we have the Canvas context
  if (AnypixelApp.context === null) {
    return;
  }
    
  // Grab the raw pixel data from the 2d or 3d context
  var pixelData;
  if (this.context.readPixels) {
    pixelData = getPixels3D(AnypixelApp.canvas.width, AnypixelApp.canvas.height, AnypixelApp.context);
  } else {
    pixelData = getPixels2D(AnypixelApp.canvas.width, AnypixelApp.canvas.height, AnypixelApp.context);
  }

  // Convert the pixel data to an 8-bit ArrayBuffer
  var currentByte = 0;
  var data_8 = new ArrayBuffer(pixelData.length / 4 * 3 + 1); // From 4 channel to 3 channel + 1 header
  var data_8v = new Uint8Array(data_8);
  data_8v[currentByte++] = 0; // Header (0 = Pixel data)

  for (var i = 0, l = pixelData.length; i < l;) {
    data_8v[currentByte++] = pixelData[i++]; // r
    data_8v[currentByte++] = pixelData[i++]; // g
    data_8v[currentByte++] = pixelData[i++]; // b
    i++; // Ignore the alpha channel
  }

  // Send the pixel data
  this.sendMessage(data_8);
};

/**
 * Sends a given data packet to the ChromeBridge app
 */
AnypixelApp.sendMessage = function(data) {
  if (AnypixelApp.isReady === true) {
    // AnypixelApp.appWindow.postMessage(data, AnypixelApp.appOrigin);
    AnypixelApp.ws.send(data)
    // console.log("send")

  } else {
    console.error('Cannot send message to Chrome wrapper app - communication channel has not yet been opened');
  }
};

/**
 * Returns an array of pixels from a 2d context
 */
function getPixels2D(w, h, ctx) {
  var pixels = ctx.getImageData(0, 0, w, h);
  return pixels.data;
}

/**
 * Returns an array of pixels from a 3d context. Due to webgl pixel ordering, the y-axis needs to be
 * flipped.
 */
function getPixels3D(w, h, ctx) {
  var buffer = new Uint8Array(w * h * 4);
  AnypixelApp.context.readPixels(0, 0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, buffer);

  // Flip y-axis
  var buffer2 = new Uint8Array(w * h * 4);
  var bufferWidth = w * 4;
  for (var i = 0, l = buffer.length; i < l; i++) {
    var row = Math.floor(i / bufferWidth);
    var row2 = h - row - 1;
    var i2 = (i % bufferWidth) + (row2 * bufferWidth);
    buffer2[i2] = buffer[i];
  }

  return buffer2;
}

},{}],2:[function(require,module,exports){
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
},{"./anypixel-app":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL3BhdHJpY2ttaWxsZXIvLm5wbS1wYWNrYWdlcy9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9hbnlwaXhlbC1hcHAuanMiLCJzcmMvYXBwLXJ1bm5lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKipcbiAqIEZ1bmN0aW9ucyBmb3IgbWFuYWdpbmcgY29tbXVuaWNhdGlvbnMgYmV0d2VlbiB0aGUgY3VycmVudCBBbnlwaXhlbCBhcHAgYW5kIENocm9tZUJyaWRnZS4gVGhpcyBcbiAqIGhhbmRsZXMgc2VuZGluZyB0aGUgY2FudmFzIHBpeGVsIGRhdGEgdG8gQ2hyb21lQnJpZGdlLCBhbmQgZGVhbHMgd2l0aCBtZXNzYWdlcyBzZW50IGZyb21cbiAqIENocm9tZUJyaWRnZS5cbiAqL1xudmFyIEFueXBpeGVsQXBwID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuQW55cGl4ZWxBcHAuaXNSZWFkeSA9IGZhbHNlO1xuXG5BbnlwaXhlbEFwcC5hcHBXaW5kb3cgPSBudWxsO1xuXG5BbnlwaXhlbEFwcC5hcHBPcmlnaW4gPSBudWxsO1xuXG5BbnlwaXhlbEFwcC5jb250ZXh0ID0gbnVsbDtcblxuQW55cGl4ZWxBcHAuY2FudmFzID0gbnVsbDtcblxuQW55cGl4ZWxBcHAuRXZlbnRzID0ge1xuICBSZWFkeSAgICAgICA6ICdidXR0b25XYWxsUmVhZHknLFxuICBCdXR0b25TdGF0ZXM6ICdidXR0b25TdGF0ZXMnLFxufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBjYW52YXMgdG8gYW4gZWxlbWVudCB3aXRoIGEgZ2l2ZW4gaWRcbiAqL1xuQW55cGl4ZWxBcHAuc2V0Q2FudmFzID0gZnVuY3Rpb24oY2FudmFzSWQpIHtcbiAgQW55cGl4ZWxBcHAuY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzSWQpO1xuICBBbnlwaXhlbEFwcC5jb250ZXh0ID0gQW55cGl4ZWxBcHAuY2FudmFzLmdldENvbnRleHQoJzJkJykgfHwgQW55cGl4ZWxBcHAuY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJyk7XG59O1xuXG5BbnlwaXhlbEFwcC5zZXRXUyA9IGZ1bmN0aW9uKHdzKXtcbiAgQW55cGl4ZWxBcHAud3MgPSB3c1xufVxuXG5BbnlwaXhlbEFwcC5zZXRSZWFkeSA9IGZ1bmN0aW9uKCl7XG4gIEFueXBpeGVsQXBwLmlzUmVhZHkgPSB0cnVlO1xuICAgIC8vIEFueXBpeGVsQXBwLmFwcFdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcbiAgICAvLyBBbnlwaXhlbEFwcC5hcHBPcmlnaW4gPSBldmVudC5vcmlnaW47XG5cbiAgICAvLyBTZW5kIHRoZSByZWFkeSBldmVudFxuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KEFueXBpeGVsQXBwLkV2ZW50cy5SZWFkeSkpO1xufVxuLyoqXG4gKiBMaXN0ZW5lciBmb3IgbWVzc2FnZSByZWNlaXZlZCBldmVudHMuIFBhcnNlcyBpbmNvbWluZyBtZXNzYWdlcyBpbnRvIGpzIGV2ZW50cyBhbmQgZGlzcGF0Y2hlcyB0aGVtLlxuICovXG5cbkFueXBpeGVsQXBwLnJlY2VpdmVNZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgLy8gSWYgZmlyc3QgbWVzc2FnZSwgZGlzcGF0Y2ggdGhlIHJlYWR5IGV2ZW50XG4gIGlmICghQW55cGl4ZWxBcHAuaXNSZWFkeSkge1xuICAgIGNvbnNvbGUubG9nKCdPcGVuZWQgY29tbXVuaWNhdGlvbiB3aXRoIHRoZSBDaHJvbWUgYXBwLicpO1xuXG4gICAgLy8gU2F2ZSBhcHAgcGFyYW1ldGVyc1xuICAgIEFueXBpeGVsQXBwLmlzUmVhZHkgPSB0cnVlO1xuICAgIEFueXBpeGVsQXBwLmFwcFdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcbiAgICBBbnlwaXhlbEFwcC5hcHBPcmlnaW4gPSBldmVudC5vcmlnaW47XG5cbiAgICAvLyBTZW5kIHRoZSByZWFkeSBldmVudFxuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KEFueXBpeGVsQXBwLkV2ZW50cy5SZWFkeSkpO1xuICB9IGVsc2Uge1xuICAgIC8vIFBhcnNlIG1lc3NhZ2VcbiAgICBpZiAoZXZlbnQgJiYgZXZlbnQuZGF0YSkge1xuICAgICAgdmFyIGRhdGE4diA9IG5ldyBVaW50OEFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgLy8gQ2hlY2sgbWVzc2FnZSB0eXBlXG4gICAgICB2YXIgbWVzc2FnZV90eXBlID0gZGF0YTh2WzBdO1xuXG4gICAgICAvLyBDYXNlOiBCdXR0b24gc3RhdGVzXG4gICAgICBpZiAobWVzc2FnZV90eXBlID09IDApIHtcbiAgICAgICAgLy8gUGFyc2UgYnV0dG9uIHN0YXRlcyBhbmQgZGlzcGF0Y2ggZXZlbnQgd2l0aCB1cGRhdGVzXG4gICAgICAgIHZhciBidXR0b25TdGF0ZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBkYXRhOHYubGVuZ3RoOyBpKyspIHsgLy8gU2tpcCBmaXJzdCBieXRlIChoZWFkZXIpXG4gICAgICAgICAgdmFyIGJ1dHRvbkRhdGEgPSB7XG4gICAgICAgICAgICBwOiB7XG4gICAgICAgICAgICAgIHk6IGRhdGE4dltpKytdLFxuICAgICAgICAgICAgICB4OiBkYXRhOHZbaSsrXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHM6IGRhdGE4dltpXVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGJ1dHRvblN0YXRlcy5wdXNoKGJ1dHRvbkRhdGEpOyAgICAgICAgIFxuICAgICAgICB9XG5cbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoQW55cGl4ZWxBcHAuRXZlbnRzLkJ1dHRvblN0YXRlcywge1xuICAgICAgICAgICdkZXRhaWwnOiBidXR0b25TdGF0ZXNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBHcmFicyB0aGUgcGl4ZWxzIGZyb20gdGhlIGNhbnZhcyBhbmQgc2VuZHMgdGhlbSB0byB0aGUgQ2hyb21lQnJpZGdlIGFwcCB2aWEgcG9zdE1lc3NhZ2UoKVxuICovXG5BbnlwaXhlbEFwcC51cGRhdGVGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBWZXJpZnkgdGhhdCB3ZSBoYXZlIHRoZSBDYW52YXMgY29udGV4dFxuICBpZiAoQW55cGl4ZWxBcHAuY29udGV4dCA9PT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICAgIFxuICAvLyBHcmFiIHRoZSByYXcgcGl4ZWwgZGF0YSBmcm9tIHRoZSAyZCBvciAzZCBjb250ZXh0XG4gIHZhciBwaXhlbERhdGE7XG4gIGlmICh0aGlzLmNvbnRleHQucmVhZFBpeGVscykge1xuICAgIHBpeGVsRGF0YSA9IGdldFBpeGVsczNEKEFueXBpeGVsQXBwLmNhbnZhcy53aWR0aCwgQW55cGl4ZWxBcHAuY2FudmFzLmhlaWdodCwgQW55cGl4ZWxBcHAuY29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgcGl4ZWxEYXRhID0gZ2V0UGl4ZWxzMkQoQW55cGl4ZWxBcHAuY2FudmFzLndpZHRoLCBBbnlwaXhlbEFwcC5jYW52YXMuaGVpZ2h0LCBBbnlwaXhlbEFwcC5jb250ZXh0KTtcbiAgfVxuXG4gIC8vIENvbnZlcnQgdGhlIHBpeGVsIGRhdGEgdG8gYW4gOC1iaXQgQXJyYXlCdWZmZXJcbiAgdmFyIGN1cnJlbnRCeXRlID0gMDtcbiAgdmFyIGRhdGFfOCA9IG5ldyBBcnJheUJ1ZmZlcihwaXhlbERhdGEubGVuZ3RoIC8gNCAqIDMgKyAxKTsgLy8gRnJvbSA0IGNoYW5uZWwgdG8gMyBjaGFubmVsICsgMSBoZWFkZXJcbiAgdmFyIGRhdGFfOHYgPSBuZXcgVWludDhBcnJheShkYXRhXzgpO1xuICBkYXRhXzh2W2N1cnJlbnRCeXRlKytdID0gMDsgLy8gSGVhZGVyICgwID0gUGl4ZWwgZGF0YSlcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBpeGVsRGF0YS5sZW5ndGg7IGkgPCBsOykge1xuICAgIGRhdGFfOHZbY3VycmVudEJ5dGUrK10gPSBwaXhlbERhdGFbaSsrXTsgLy8gclxuICAgIGRhdGFfOHZbY3VycmVudEJ5dGUrK10gPSBwaXhlbERhdGFbaSsrXTsgLy8gZ1xuICAgIGRhdGFfOHZbY3VycmVudEJ5dGUrK10gPSBwaXhlbERhdGFbaSsrXTsgLy8gYlxuICAgIGkrKzsgLy8gSWdub3JlIHRoZSBhbHBoYSBjaGFubmVsXG4gIH1cblxuICAvLyBTZW5kIHRoZSBwaXhlbCBkYXRhXG4gIHRoaXMuc2VuZE1lc3NhZ2UoZGF0YV84KTtcbn07XG5cbi8qKlxuICogU2VuZHMgYSBnaXZlbiBkYXRhIHBhY2tldCB0byB0aGUgQ2hyb21lQnJpZGdlIGFwcFxuICovXG5BbnlwaXhlbEFwcC5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgaWYgKEFueXBpeGVsQXBwLmlzUmVhZHkgPT09IHRydWUpIHtcbiAgICAvLyBBbnlwaXhlbEFwcC5hcHBXaW5kb3cucG9zdE1lc3NhZ2UoZGF0YSwgQW55cGl4ZWxBcHAuYXBwT3JpZ2luKTtcbiAgICBBbnlwaXhlbEFwcC53cy5zZW5kKGRhdGEpXG4gICAgLy8gY29uc29sZS5sb2coXCJzZW5kXCIpXG5cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdDYW5ub3Qgc2VuZCBtZXNzYWdlIHRvIENocm9tZSB3cmFwcGVyIGFwcCAtIGNvbW11bmljYXRpb24gY2hhbm5lbCBoYXMgbm90IHlldCBiZWVuIG9wZW5lZCcpO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgcGl4ZWxzIGZyb20gYSAyZCBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGdldFBpeGVsczJEKHcsIGgsIGN0eCkge1xuICB2YXIgcGl4ZWxzID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3LCBoKTtcbiAgcmV0dXJuIHBpeGVscy5kYXRhO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgcGl4ZWxzIGZyb20gYSAzZCBjb250ZXh0LiBEdWUgdG8gd2ViZ2wgcGl4ZWwgb3JkZXJpbmcsIHRoZSB5LWF4aXMgbmVlZHMgdG8gYmVcbiAqIGZsaXBwZWQuXG4gKi9cbmZ1bmN0aW9uIGdldFBpeGVsczNEKHcsIGgsIGN0eCkge1xuICB2YXIgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodyAqIGggKiA0KTtcbiAgQW55cGl4ZWxBcHAuY29udGV4dC5yZWFkUGl4ZWxzKDAsIDAsIHcsIGgsIGN0eC5SR0JBLCBjdHguVU5TSUdORURfQllURSwgYnVmZmVyKTtcblxuICAvLyBGbGlwIHktYXhpc1xuICB2YXIgYnVmZmVyMiA9IG5ldyBVaW50OEFycmF5KHcgKiBoICogNCk7XG4gIHZhciBidWZmZXJXaWR0aCA9IHcgKiA0O1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGJ1ZmZlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgcm93ID0gTWF0aC5mbG9vcihpIC8gYnVmZmVyV2lkdGgpO1xuICAgIHZhciByb3cyID0gaCAtIHJvdyAtIDE7XG4gICAgdmFyIGkyID0gKGkgJSBidWZmZXJXaWR0aCkgKyAocm93MiAqIGJ1ZmZlcldpZHRoKTtcbiAgICBidWZmZXIyW2kyXSA9IGJ1ZmZlcltpXTtcbiAgfVxuXG4gIHJldHVybiBidWZmZXIyO1xufVxuIiwiLypcbkNvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuXG5cbnZhciBBbnlwaXhlbEFwcCA9IHJlcXVpcmUoJy4vYW55cGl4ZWwtYXBwJyk7XG5sZXQgd3MgPSBudWxsO1xuZnVuY3Rpb24gc2hvd01lc3NhZ2UobWVzc2FnZSl7XG4gIGNvbnNvbGUubG9nKG1lc3NhZ2UpXG59XG5mdW5jdGlvbiBjb25uZWN0KCkge1xuICBpZiAod3MpIHtcbiAgICB3cy5vbmVycm9yID0gd3Mub25vcGVuID0gd3Mub25jbG9zZSA9IG51bGw7XG4gICAgd3MuY2xvc2UoKTtcbiAgfVxuXG4gIHdzID0gbmV3IFdlYlNvY2tldChgd3M6Ly8ke2xvY2F0aW9uLmhvc3R9YCk7XG5cbiAgd3MuYmluYXJ5VHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gIHdzLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2hvd01lc3NhZ2UoXCJXZWJTb2NrZXQgZXJyb3JcIik7XG4gIH07XG4gIHdzLm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBzaG93TWVzc2FnZShcIldlYlNvY2tldCBjb25uZWN0aW9uIGVzdGFibGlzaGVkXCIpO1xuICAgIEFueXBpeGVsQXBwLnNldFdTKHdzKVxuICB9O1xuICB3cy5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIHNob3dNZXNzYWdlKFwiV2ViU29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkXCIpO1xuICAgIHdzID0gbnVsbDtcbiAgICBzZXRUaW1lb3V0KGNvbm5lY3QsIDEwMClcbiAgfTtcbiAgd3Mub25tZXNzYWdlID0gKGV2ZW50KT0+e1xuICAgIC8vIGNvbnNvbGUubG9nKG5ldyBVaW50OEFycmF5KGV2ZW50LmRhdGEpLCBldmVudC50eXBlKVxuICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpXG4gICAgQW55cGl4ZWxBcHAucmVjZWl2ZU1lc3NhZ2UoZXZlbnQpXG4gICAgLy8gcGFyc2VQYWNrZXQoZXZlbnQuZGF0YSlcbiAgfVxufVxuY29ubmVjdCgpXG5cblxuLyoqXG4gKiBGdW5jdGlvbnMgZm9yIHJ1bm5pbmcgdGhlIHVwZGF0ZSBsb29wIGZvciB0aGUgY3VycmVudCBBbnlwaXhlbCBhcHBcbiAqL1xudmFyIEFwcFJ1bm5lciA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbkFwcFJ1bm5lci5jYW52YXNJZCA9ICdidXR0b24tY2FudmFzJztcblxuQXBwUnVubmVyLndzID0gd3NcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJ0FwcCBSdW5uZXI6IEluaXQnKTtcblxuICAvLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIHNlbnQgYnkgdGhlIENocm9tZSBBcHBcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBBbnlwaXhlbEFwcC5yZWNlaXZlTWVzc2FnZSk7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBBbnlwaXhlbEFwcC5zZXRDYW52YXMoQXBwUnVubmVyLmNhbnZhc0lkKTtcbiAgfSwgMjUpO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJzZXR0aW5nIHJlYWR5LlwiKVxuICAgIFxuICAgIEFueXBpeGVsQXBwLnNldFJlYWR5KClcbiAgfSwgMTAwMCk7XG5cbiAgLy8gU3RhcnQgc2FtcGxpbmcgY2FudmFzIGRhdGFcbiAgdmFyIHNhbXBsZUludGVydmFsID0gbnVsbDtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYnV0dG9uV2FsbFJlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ0FwcCBSdW5uZXI6IEJ1dHRvbiB3YWxsIHJlYWR5Jyk7XG4gICAgc2FtcGxlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgIEFueXBpeGVsQXBwLnVwZGF0ZUZyYW1lKCk7XG4gICAgfSwgMTcpOyAvLyAxIC8gNjBmcHMg4omIIDE3bXNcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXA6IGNsZWFyIHRoZSBzYW1wbGVyIGludGVydmFsXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnQXBwIFJ1bm5lcjogQ2xlYW5pbmcgdXAuLi4nKTtcbiAgICBpZiAoc2FtcGxlSW50ZXJ2YWwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoc2FtcGxlSW50ZXJ2YWwpO1xuICAgIH1cbiAgfSk7XG59LCBmYWxzZSk7Il19
