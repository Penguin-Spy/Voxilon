import Renderer from '/client/Renderer.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import PlayerController from '/client/PlayerController.js'

import main_menu from '/client/views/main_menu.js'

import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import CelestialBody from '/common/CelestialBody.js';
import Mesh from '/common/Mesh.js';
import Texture from '/client/Texture.js';

function $(query) {  // not jQuery!! just looks like it :troll:
  return document.querySelector(query);
}

// initalize engine
const glCanvas = $("#glCanvas");
const renderer = new Renderer(glCanvas);
const input = new Input(glCanvas);
const gui = new GUI($("#gui"));
const playerController = new PlayerController(input);

gui.loadScreen(main_menu, "title", { directLink, networkLink })
const debugFrame = gui.addFrame("gui-debug")

let renderRequest, then = 0

// ticks the physics engine and then the Server (crafting machines, belts, vehicles, etc.)
function animate(now) {
  const deltaTime = (now - then) / 1000;
  then = now;
  debugFrame.innerText = `FPS: ${(1/deltaTime).toFixed(2)}`

  playerController.update(deltaTime)
  link.world.step(deltaTime)

  renderer.render(link.world)
  renderRequest = requestAnimationFrame(animate)
}


let testbody, testbody2
function start() {
  playerController.attach(link)
  renderer.attach(link.playerBody)

  gui.clearScreen()

  /* extra body for testing */
  const rigidbody = new CANNON.Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1)
  })
  const mesh = new Mesh("Cube", new Texture("debug.png"))
  testbody = new CelestialBody(rigidbody, mesh)
  testbody.position = { x: 2, y: 2, z: -7 }
  link.world.addBody(testbody)

  const rigidbody2 = new CANNON.Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1),
    type: CANNON.Body.STATIC,

  })
  testbody2 = new CelestialBody(rigidbody2, mesh)
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
    linkModules.direct = (await import('./directLink/Link.js')).default
  }

  console.info("Starting direct link")
  link = new linkModules.direct(worldOptions)

  start()
}

async function networkLink(gameCode) {
  if (!linkModules.network) {
    linkModules.network = (await import('./networkLink/Link.js')).default
  }

  console.info("Starting network link")
  link = new linkModules.network(gameCode)

  start()
}

export { renderer, input, gui, playerController, testbody, testbody2, link };