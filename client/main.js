var renderer = null;
var input = null;
var PacketEncoder = null;
var PacketDecoder = null;
var world = null;

var ourBodyID = null;

var socket = null;

var debug = {
  fps: document.getElementById("debug.fps"), 
  pos: document.getElementById("debug.pos"),
  mouse: document.getElementById("debug.mouse")
}
const chatMessages = document.getElementById("messages");

window.addEventListener('resize', () => {
  renderer.resize(window.innerWidth, window.innerHeight);
});

var then = 0;
function renderTick(now) {
  now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;

  const fps = 1 / deltaTime;
  debug.fps.innerHTML = `FPS: ${fps.toFixed(2)}`

  try {
	  renderer.render(world, deltaTime);
  } catch(e) {
    alert(`${e}\n${e.fileName}:${e.lineNumber}`)
  }
  requestAnimationFrame(renderTick);
}

requirejs.config({
  paths: {
    common: '../common',
    client: '../client'
  }
});

// initalize engine
requirejs(['Renderer', 'Input', 'PlayerController', 'common/PacketEncoder', 'common/PacketDecoder', 'common/World'], 
function(   Renderer,   Input,   PlayerController,   PacketEncoder,          PacketDecoder,          World) {
  import * as CANNON;
  
  glCanvas = document.getElementById("glCanvas");

  input = new Input();
  input.bindToCanvas(glCanvas);

  renderer = new Renderer();
  renderer.init(glCanvas);

  window.PacketEncoder = PacketEncoder;
  window.PacketDecoder = PacketDecoder;

  world = new World();

  playerController = new PlayerController(input);

  document.getElementById("joinButton").removeAttribute("class");
});


// prepare world & start game & render loop
function start(username, bodyID) {
  ourBodyID = bodyID
  playerController.attach(world.getBody(ourBodyID));
  renderer.attach(world.getBody(ourBodyID));
  renderTick(0);
  tick();
  
  document.getElementById("mainMenu").hidden = true;
  document.getElementById("disconnected").hidden = true;
  document.getElementById("controls").hidden = false;
  document.getElementById("chat").hidden = false;
  document.getElementById("debug").hidden = false;
  document.getElementsByTagName("title")[0].textContent = `${username} - Voxilon`
}

// idk how to write a game
var ticks = 0;
var tickTimeout;

function tick() {
  tickTimeout = setTimeout(tick, 1000/60);
  playerController.tick();
  ticks++;
  if(ticks % 6 == 0) {
    try {
  movePacket = PacketEncoder.moveBody(ourBodyID, playerController.posDelta, new Float64Array([0,0,0]));
  socket.send(movePacket);
      playerController.posDelta = {x:0, y:0, z:0}
  rotatePacket = PacketEncoder.rotateBody(ourBodyID, playerController.body.quaternion.inverse());
  socket.send(rotatePacket);

  } catch(e) {
    alert(`${e}\n${e.fileName}:${e.lineNumber}`)
  }
  }

  const pos = playerController.body.position;
  debug.pos.innerHTML = `XYZ: ${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}\
 | PY: ${(playerController.pitch / Math.PI * 180).toFixed(2)}, ${(playerController.yaw / Math.PI * 180).toFixed(2)}`
  
}

function connect() {
  try {
  // reset world (for reconnect)
  world.bodies = [];

  const gameCode = document.getElementById("gameCode").value;
  const username = document.getElementById("username").value;

  socket = new WebSocket(`wss://${window.location.host}/session/${gameCode}`);
  socket.onmessage = async function(event) {
    if (event.data instanceof Blob) {
      let arrayBuffer = await event.data.arrayBuffer();
      let decodedPacket = PacketDecoder.decode(arrayBuffer);
      switch(decodedPacket.type) {
        case "addBody":
          world.setBody(decodedPacket.bodyID, decodedPacket.position, decodedPacket.quaternion, decodedPacket.meshName, decodedPacket.textureUrl, decodedPacket.selfBody);
          if(decodedPacket.selfBody) { // Signifies this player's body
            start(username, decodedPacket.bodyID);  // we can begin the game loop now that we have the player  
          }
          break;
        case "moveBody":
          world.moveBody(decodedPacket.bodyID, decodedPacket.position, decodedPacket.velocity);
          break;
        case "chat":
          recieveChat(decodedPacket.message)
          break;
        case "removeBody":
          world.removeBody(decodedPacket.bodyID);
          break;
        case "rotateBody":
          world.rotateBody(decodedPacket.bodyID, decodedPacket.quaternion);
          break;
        default:
          console.log(`[Error]: Unknown receive packet type: ${decodedPacket.typeByte}\nData:`);
          console.log(arrayBuffer);
      }
    } else {
      console.log("Result: " + event.data);
    }
  }

  socket.onopen = (event) => {
    // only runs once
    socket.send(PacketEncoder.connect(username));
  }

  socket.onclose = (event) => {
    console.log(event);
    clearTimeout(tickTimeout);
    document.getElementById("disconnected").hidden = false;
  }

  } catch(e) {
    alert(`${e}\n${e.fileName}:${e.lineNumber}`)
  }
}

function sendChat() {
  message = document.getElementById("inputMessage").value;
  message = PacketEncoder.sanitizeInput(message);
  document.getElementById("inputMessage").value = "";
  if(message.startsWith(".")) {
    let result = false
    let command = message.substring(1).split(" ")
    switch(command[0]) {
      case "dump": 
        switch(command[1]) {
          case "bodies":
            world.bodies.forEach((body, id) => {
              alert(`${id}:\n\t(${body.position.x},${body.position.y},${body.position.z})\n\t(${body.quaternion.x},${body.quaternion.y},${body.quaternion.z},${body.quaternion.w})`)
            })
          break;
          default: 
            result = "invalid dump target"
        }
      break;
      default: 
        result = "Unknown command"
    }
    if(result) {
      recieveChat(result)
    }
  } else {
    chatPacket = PacketEncoder.chat(message);
    socket.send(chatPacket); 
  }
}

function recieveChat(message) {
  chatMessages.innerHTML += message + "<br>";
  if(chatMessages.childElementCount > 9) {
    chatMessages.removeChild(chatMessages.childNodes[0]); // #text
    chatMessages.removeChild(chatMessages.childNodes[0]); // <br>
  }
}