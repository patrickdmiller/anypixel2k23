const express = require("express");
const app = require("express")();
const ws = require('ws')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const FPS = 60
app.use(express.static("public"));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

let runner = null;
let pixelMessageCount = 0
app.use(bodyParser.json());
app.use(cookieParser());
const server = require('http').Server(app);
const wsServer = new ws.Server({ noServer: true });
sockets = {}
wsServer.on('connection', socket => {
  sockets[socket] = socket
  socket.on('message', packet => {
    message = parsePacket(packet)
  });

  socket.on('close', ()=>{
    delete sockets[socket]
  })
});
function sendToSockets(bin){
  for(key in sockets){
    try{
      sockets[key].send(bin)

    }catch(e){}
  }
}
setInterval(printSummary, 1000)
function jsonToPacket(json){
  let s = JSON.stringify(json)
  let buffer = new Uint8Array(s.length+1)
  buffer[0] = 0x01
  const encoder = new TextEncoder();
  encoder.encodeInto(s, buffer.subarray(1))
  return buffer
}
function jsonFromPacket(view8bit){
  message = new Uint8Array(view8bit.length - 1)
  for(let i = 1; i < view8bit.length; i++){
    message[i-1] = view8bit[i]
  }
  message = JSON.parse(new TextDecoder().decode(message));
  return message
}
function parsePacket(packet){
  view8bit = new Uint8Array(packet)
  switch(view8bit[0]){
    case 0:
      // #it's pixel data
      pixelMessageCount++
      break
    case 1:
      json = jsonFromPacket(view8bit)
      commandHandler(json)
      break
  }
}

function commandHandler(c){
  if(c && c.method){
    switch(c.method){
      case 'start_test_button':
        startButtonTest()
        break
      case 'stop_test_button':
        stopButtonTest()
    }
  }
}

function printSummary(){
  console.log("pixel frames: ", pixelMessageCount)
  
  sendToSockets(jsonToPacket({pixelMessageCount}))
  pixelMessageCount = 0
}
server.listen(3000);
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});

function sendButtonData({ byteLength = 6000 * 4 } = {}) {
  if (!ws) {
    console.error("ws not valid");
    return;
  }
  let headerLength = 1
  let packet = new Uint8Array(byteLength + headerLength)
  packet[0] = 0
  for(let i = 1; i < packet.length; i++){
    packet[i] = 1
  }
  sendToSockets(packet)
}

function startButtonTest({ fps = FPS } = {}) {
  if (runner !== null) {
    console.error("Button test already running");
  } else {
    console.log("starting Button test.");
    // runner = setInterval(sendButtonData)
    runner = setInterval(sendButtonData, 1000 / fps);
  }
}
function stopButtonTest() {
  console.log("stopping Button test");
  clearInterval(runner);
  runner = null;
}