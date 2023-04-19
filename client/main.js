import Renderer from '/client/Renderer.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import HUD from '/client/HUD.js'
import PlayerController from '/client/PlayerController.js'

import main_menu from '/client/views/main_menu.js'

import * as CANNON from 'cannon'
import Body from '/common/Body.js'
import Mesh from '/common/Mesh.js'
import Texture from '/client/Texture.js'

function $(query) {  // not jQuery!! just looks like it :troll:
  return document.querySelector(query);
}

// initalize engine
const renderer = new Renderer();
Input.useCanvas(renderer.getCanvas());
const hud = new HUD();
const playerController = new PlayerController();

GUI.loadScreen(main_menu, "title", { directLink, networkLink })
const debugFrame = GUI.addFrame("gui-debug")

let renderRequest, then = 0

// ticks the physics engine and then the Server (crafting machines, belts, vehicles, etc.)
function animate(now) {
  const deltaTime = (now - then) / 1000;
  then = now;
  debugFrame.innerText = `FPS: ${(1 / deltaTime).toFixed(2)}`

  playerController.update(deltaTime)
  hud.update()
  link.world.step(deltaTime)

  renderer.render(link.world)
  renderRequest = requestAnimationFrame(animate)
}


let testbody, testbody2
function start() {
  window.Voxilon.link = link;
  
  playerController.attach(link)
  renderer.attach(link.playerBody)
  hud.attach(playerController, link)

  GUI.clearScreen()
  hud.show()
  Input.enablePointerLock()
  Input.requestPointerLock()

  /* extra body for testing */
  testbody = new Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1)

  }, undefined)
  //new Mesh("Cube", new Texture("debug.png"))

  testbody.position = { x: 2, y: 2, z: -7 }
  link.world.addBody(testbody)

  /**/
  testbody2 = new Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1),
    type: CANNON.Body.STATIC,

  }, false)

  testbody2.position = { x: -2, y: 2, z: -7 }
  link.world.addBody(testbody2)
  /**/

  requestAnimationFrame(animate)
}

function stop() {
  cancelAnimationFrame(renderRequest)
}

/* --- Direct/Network link --- */

const linkModules = {}
let link  // current link, may be undefined

async function directLink(worldOptions) {
  if (!linkModules.direct) {
    linkModules.direct = (await import('/link/DirectLink.js')).default
  }

  console.info("Starting direct link")
  link = new linkModules.direct(worldOptions)

  start()
}
async function networkLink(gameCode, username) {
  if (!linkModules.network) {
    linkModules.network = (await import('/link/NetworkLink.js')).default
  }

  console.info(`Starting network link w/ code: ${gameCode} & username: ${username}`)
  link = new linkModules.network(gameCode, username)

  start()
}

window.Voxilon = { renderer, Input, GUI, hud, playerController, link, stop, testbody, testbody2 };