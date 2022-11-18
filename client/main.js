import Renderer from './client/Renderer.js'
import Input from './client/Input.js'
import GUI from './client/GUI.js'
import PlayerController from './client/PlayerController.js'

import main_menu from '/client/views/main_menu.js'


function $(query) {  // not jQuery!! just looks like it :troll:
  return document.querySelector(query);
}

// initalize engine
const glCanvas = $("#glCanvas");
const input = new Input(glCanvas);
const renderer = new Renderer(glCanvas);
const gui = new GUI($("#gui"));
const playerController = new PlayerController(input);

gui.loadScreen(main_menu, "title", { directLink, networkLink })


let then = 0;
function renderTick(now) {
  /*now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;

  const fps = 1 / deltaTime;
  */
  //debug.fps.innerHTML = `FPS: ${fps.toFixed(2)}`

  try {
    renderer.render(world, deltaTime);
  } catch (e) {
    console.error(e);//`${e.name} while rendering:\n${e.message}\n${e.fileName}:${e.lineNumber}`)
  }
  requestAnimationFrame(renderTick);
}

// idk how to write a game
var ticks = 0;
var tickTimeout;

function tick() {
  tickTimeout = setTimeout(tick, 1000 / 60);
  playerController.tick();
  ticks++;

  world.getBody(ourBodyID).rigidBody.applyForce(playerController.moveVector)

}

/* --- Direct/Network link --- */

const linkModules = {}
let link  // current link, may be undefined

async function directLink(worldOptions) {
  if (!linkModules.direct) {
    linkModules.direct = (await import('./directLink/Link.js')).default
  }

  console.log(worldOptions)

  console.info("Starting direct link")
  link = new linkModules.direct(playerController)
  link.start()
}

async function networkLink(gameCode) {
  if (!linkModules.network) {
    linkModules.network = (await import('./networkLink/Link.js')).default
  }

  console.info("Starting network link")
  link = new linkModules.network(playerController)
  link.start()
}



// prepare world & start game & render loop
/*function start(username, bodyID) {
  try {
    playerController.attach(world.getBody(ourBodyID));
    renderer.attach(world.getBody(ourBodyID));
    renderTick(0);
    tick();

    //document.getElementsByTagName("title")[0].textContent = `${username} - Voxilon`

  } catch (e) {
    console.error(`${e.name} while starting:\n${e.message}\n${e.fileName}:${e.lineNumber}`)
  }
}

function connect() {
  socket.onmessage = async function(event) {
    "addBody"
    if (decodedPacket.selfBody) { // Signifies this player's body
      start(username, decodedPacket.bodyID);  // we can begin the game loop now that we have the player  
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

}*/


export { renderer, input, gui, link };