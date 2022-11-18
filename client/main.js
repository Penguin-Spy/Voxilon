import Renderer from '/client/Renderer.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import PlayerController from '/client/PlayerController.js'
import PlayerBody from '/common/bodies/Player.js'

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

let tickTimeout, renderRequest //, then = 0

// ticks the physics engine and then the Server (crafting machines, belts, vehicles, etc.)
function tick() {
  tickTimeout = setTimeout(tick, 1000 / 60)

  playerController.tick();
  playerBody.rigidBody.applyForce(playerController.moveVector)

  link.world.tick()
}

function render(now) {
  /*now *= 0.001  // convert to seconds
  const deltaTime = now - then
  then = now
  const fps = 1 / deltaTime*/

  renderer.render(link.world)

  renderRequest = requestAnimationFrame(render)

}

let playerBody, testbody
function start() {
  playerBody = new PlayerBody()
  link.world.addBody(playerBody)

  playerController.attach(playerBody)
  renderer.attach(playerBody)

  gui.clearScreen()

  /* extra body for testing */
  const rigidbody = new CANNON.Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1)
  })
  const mesh = new Mesh("Cube", new Texture("debug.png"))
  testbody = new CelestialBody(rigidbody, mesh)
  testbody.position = { x: 7, y: 1, z: -2 }
  link.world.addBody(testbody)
  /**/

  tick()
  requestAnimationFrame(render)
}

function stop() {
  clearTimeout(tickTimeout)
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
  link = new linkModules.direct({
    playerController,
    renderer
  }, worldOptions)

  start()
}

async function networkLink(gameCode) {
  if (!linkModules.network) {
    linkModules.network = (await import('./networkLink/Link.js')).default
  }

  console.info("Starting network link")
  link = new linkModules.network({
    playerController,
    renderer
  })

  start()
}



export { renderer, input, gui, playerController, playerBody, testbody, link };