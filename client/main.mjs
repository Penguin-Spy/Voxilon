import Renderer from './client/Renderer.mjs'
import Input from './client/Input.mjs'
import PlayerController from './client/PlayerController.mjs'
import PacketEncoder from './common/PacketEncoder.mjs'
import PacketDecoder from './common/PacketDecoder.mjs'
import World from './client/World.mjs'

let debug = {
  fps: document.getElementById("debug.fps"), 
  pos: document.getElementById("debug.pos"),
  mouse: document.getElementById("debug.mouse")
}
const chatMessages = document.getElementById("messages");

window.addEventListener('resize', () => {
  renderer.resize(window.innerWidth, window.innerHeight);
});

let then = 0;
function renderTick(now) {
  now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;

  const fps = 1 / deltaTime;
  debug.fps.innerHTML = `FPS: ${fps.toFixed(2)}`

  try {
	  renderer.render(world, deltaTime);
  } catch(e) {
    alert(`${e.name} while rendering:\n${e.message}\n${e.fileName}:${e.lineNumber}`)
  }
  requestAnimationFrame(renderTick);
}

// initalize engine
  

let ourBodyID = null;
let socket = null;
let glCanvas = document.getElementById("glCanvas");

let input = new Input(glCanvas);

let renderer = new Renderer();
renderer.init(glCanvas);


let world
const playerController = new PlayerController(input);

document.getElementById("joinButton").removeAttribute("class");

// prepare world & start game & render loop
function start(username, bodyID) { try {
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

  } catch(e) {
    alert(`${e.name} while starting:\n${e.message}\n${e.fileName}:${e.lineNumber}`)
  }
}

// idk how to write a game
var ticks = 0;
var tickTimeout;

function tick() { try {
  tickTimeout = setTimeout(tick, 1000/60);
  playerController.tick();
  ticks++;

  let force = {
    x: input.forward ? 100 : (input.backward ? -100 : 0),
    y: input.up ? 100 : (input.down ? -0 : 0),
    z: input.right ? 100 : (input.left ? -100 : 0)
  }
  world.getBody(ourBodyID).rigidBody.applyForce(force)
  //world.moveBodyRelative(ourBodyID, playerController.posDelta)
      //playerController.posDelta = {x:0, y:0, z:0}
  //world.rotateBody(ourBodyID, playerController.body.quaternion)

  const pos = playerController.body.position;
  debug.pos.innerHTML = `XYZ: ${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}\
 | PY: ${(playerController.pitch / Math.PI * 180).toFixed(2)}, ${(playerController.yaw / Math.PI * 180).toFixed(2)}`
  
  } catch(e) {
    alert(`${e.name} while ticking:\n${e.message}\n${e.fileName}:${e.lineNumber}`)
  }
}

function connect() { try {

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
          world.rotateBody(decodedPacket.bodyID, decodedPacket.quaternion, decodedPacket.angularVelocity);
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
    socket.send(PacketEncoder.connect(username));
    
    // reset world (for reconnect)
    world = new World({
      moveBody: (...args) => {
        socket.send(PacketEncoder.moveBody(...args))
      },
      rotateBody: (...args) => {
        socket.send(PacketEncoder.rotateBody(...args))
      }
    });
  }

  socket.onclose = (event) => {
    console.log(event);
    clearTimeout(tickTimeout);
    document.getElementById("disconnected").hidden = false;
  }

  } catch(e) {
    alert(`${e.name} while connecting:\n${e.message}\n${e.fileName}:${e.lineNumber}`)
  }
}

function sendChat() {
  let message = document.getElementById("inputMessage").value;
  //message = PacketEncoder.sanitizeInput(message);
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
    const chatPacket = PacketEncoder.chat(message);
    socket.send(chatPacket); 
  }
}

function recieveChat(message) {
  const messageSpan = document.createElement('span');
  messageSpan.appendChild(document.createTextNode(message));
  messageSpan.appendChild(document.createElement('br'));
  chatMessages.appendChild(messageSpan);
  setTimeout(() => {
    console.log("removing message")
    console.log(messageSpan)
    chatMessages.removeChild(messageSpan)
  }, 10 * 1000)
}

export { input, world, sendChat, connect };