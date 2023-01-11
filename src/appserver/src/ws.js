const EventEmitter = require("events");
class WS extends EventEmitter {
  constructor(path) {
    super();
    console.log("path is ", path)
    this.path = path;
    this.ws = null;
  }

  init() {
    if (this.ws) {
      this.ws.onerror = this.ws.onopen = this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = new WebSocket(`ws://${location.host}${this.path}`);
    this.ws.onerror = (e)=>{
      console.error("ws error", e);
    };
    this.ws.onopen = ()=>{
      console.log("WebSocket connection established");
      // AnypixelApp.setWS(ws)
    };
    this.ws.onclose = ()=>{
      console.warn("WebSocket connection closed");
      this.ws = null;
      setTimeout(()=>{
        this.init()
      }, 200)
    }
    this.ws.onmessage = (event)=>{
      console.log("got message", this); 
      this.onmessage(event)
    }

 
  }

  onRawMessage(rawMessage){}
  
  onParsedMessage(parsedMessage){
    console.warn("no parsed message handler")
  }

  onmessage(event){
    console.log(event)
    this.onRawMessage(event)
    try{

      this.onParsedMessage(JSON.parse(event.data))
    }catch(e){
      console.warn('error parsing', e)
    } 
  }

  send(msg){
    if(this.ws.OPEN){
      this.ws.send(msg)
    }
    
  }
}

module.exports = { WS };
