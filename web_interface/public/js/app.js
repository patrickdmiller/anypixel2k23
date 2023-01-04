(function () {
  let ws;
  const FPS = 60
  let runner = null;
  let buttonMessageCount = 0;
  let buttons = document.querySelectorAll(".action");
  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      actionHandler(button.dataset.ref);
    });
  });

  function showMessage(message) {
    messages.textContent += `\n${message}`;
    messages.scrollTop = messages.scrollHeight;
  }

  function handleResponse(response) {
    return response.ok
      ? response.json().then((data) => JSON.stringify(data, null, 2))
      : Promise.reject(new Error("Unexpected response"));
  }

  function actionHandler(action) {
    switch (action) {
      case "run_test_pixel":
        startPixelTest();
        break;
      case "stop_test_pixel":
        stopPixelTest();
        break;
      case "run_test_button":
        ws.send(jsonToPacket({method:'start_test_button'}))
        break;
      case "stop_test_button":
        ws.send(jsonToPacket({method:'stop_test_button'}))
        break;
      default:
        return;
    }
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
    };
    ws.onclose = function () {
      showMessage("WebSocket connection closed");
      ws = null;
      setTimeout(connect, 100)
    };
    ws.onmessage = (event)=>{
      // console.log(new Uint8Array(event.data), event.type)
      parsePacket(event.data)
    }
  }
  connect()
  function startPixelTest({ fps = FPS } = {}) {
    if (runner !== null) {
      console.error("pixel test already running");
    } else {
      console.log("starting pixel test.");
      // runner = setInterval(sendPixelData)
      runner = setInterval(sendPixelData, 1000 / fps);
    }
  }
  function parsePacket(packet){
    view8bit = new Uint8Array(packet)
    switch(view8bit[0]){
      case 0:
        // #it's pixel data
        buttonMessageCount++;
        break
      case 1:
        json = jsonFromPacket(view8bit)
        updateStats({sender:'wall', ...json})

        break
    }
  }

  function stopPixelTest() {
    console.log("stopping pixel test");
    clearInterval(runner);
    runner = null;
  }
  function sendPixelData({ byteLength = 6000 * 4 } = {}) {
    if (!ws) {
      console.error("ws not valid");
      return;
    }
    let headerLength = 1
    let packet = new Uint8Array(byteLength + headerLength)
    packet[0] = 0
    for(let i = 1; i < packet.length; i++){
      packet[i] = 99
    }
    ws.send(packet);
  }

  function jsonToPacket(json){
    let s = JSON.stringify(json)
    let buffer = new Uint8Array(s.length+1)
    buffer[0] = 0x01
    const encoder = new TextEncoder();
    encoder.encodeInto(s, buffer.subarray(1))
    return buffer
  }
  //assumes header is 1 byte
  function jsonFromPacket(view8bit){
    message = new Uint8Array(view8bit.length - 1)
    for(let i = 1; i < view8bit.length; i++){
      message[i-1] = view8bit[i]
    }
    message = JSON.parse(new TextDecoder().decode(message));
    return message
  }

  setInterval( ()=>{
    if(ws){
      
      ws.send(jsonToPacket({one:'two',three:'four'}))
      
    }
  }, 1000)
  function printSummary(){
    // console.log("button frames: ", buttonMessageCount) 
    updateStats({sender:'render', buttonMessageCount})
    buttonMessageCount = 0
  }

  setInterval(printSummary, 1000)
  function updateStats(msg){

    let senderDiv = document.querySelector('#stats .'+msg.sender)
    if(senderDiv){
      senderDiv.innerHTML = JSON.stringify(msg)
    }else{
      console.warn("no sender div")
    }
    
  }
})()
