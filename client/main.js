import Renderer from '/client/Renderer.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import HUD from '/client/HUD.js'

import main_menu from '/client/views/main_menu.js'

import * as CANNON from 'cannon'
import Body from '/common/Body.js'

// remove loading error handler
// todo: make a new error handler for runtime errors? (display to user that something went wrong)
window.onerror = undefined;

function $(query) {  // not jQuery!! just looks like it :troll:
  return document.querySelector(query);
}

// initalize engine
const renderer = new Renderer();
Input.useCanvas(renderer.getCanvas());
const hud = new HUD();

GUI.loadScreen(main_menu, "title", { directLink, networkLink })

const debugFrame = GUI.addFrame("gui-debug")
const renderSpan = document.createElement("span")

const physicsDebug = document.createElement("div")
const positionSpan = document.createElement("span")
const velocitySpan = document.createElement("span")
physicsDebug.appendChild(positionSpan)
physicsDebug.appendChild(document.createElement("br"))
physicsDebug.appendChild(velocitySpan)

debugFrame.appendChild(renderSpan)
debugFrame.appendChild(physicsDebug)

let renderRequest, then = 0
// ticks the physics engine and then the Server (crafting machines, belts, vehicles, etc.)
function animate(now) {
  //const now = performance.now()
  const deltaTime = (now - then) / 1000;
  then = now;

  if(deltaTime > 0.1) { // took longer than 1/10th of a second
    if(document.visibilityState === "visible") { // if the document is visible, log warning. otherwise, silently skip frame because it's in the background.
      console.warn(`Warning: animation callback took ${(deltaTime * 1000).toFixed()}ms to trigger! Skipping step to prevent simulation instability.`)
    }
    renderRequest = requestAnimationFrame(animate)
    return;
  }

  // --- Physics ---
  link.playerController.updateRotation(deltaTime)
  hud.update()

  link.step(deltaTime)

  // --- Render ---
  renderSpan.innerText = `FPS: ${(1 / deltaTime).toFixed(2)}`
  const _velocity = link.playerBody.velocity
  const _position = link.playerBody.position
  positionSpan.innerHTML = ` X: ${_position.x.toFixed(3)}  Y: ${_position.y.toFixed(3)}  Z: ${_position.z.toFixed(3)}`
  velocitySpan.innerHTML = `vX: ${_velocity.x.toFixed(3)} vY: ${_velocity.y.toFixed(3)} vZ: ${_velocity.z.toFixed(3)}`

  renderer.render(link.world)

  // only request the next frame if this one succeded
  renderRequest = requestAnimationFrame(animate)
}


let testbody, testbodyTwo
function start() {
  window.Voxilon.link = link;
  
  link.playerController.attach(link, hud)
  renderer.attach(link.playerBody)
  hud.attach(link)

  GUI.clearScreen()
  hud.show()
  Input.enablePointerLock()
  Input.requestPointerLock()

  /* extra body for testing */
  testbody = new Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1)
  })

  testbody.position = { x: 2, y: 44, z: -7 }
  link.world.addBody(testbody)

  /**/
  testbodyTwo = new Body({
    mass: 1, // kg
    shape: new CANNON.Sphere(1),
    type: CANNON.Body.STATIC,
  })

  testbodyTwo.position = { x: -2, y: 44, z: -7 }
  link.world.addBody(testbodyTwo)
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
    try {
      linkModules.direct = (await import('/link/DirectLink.js')).default
    } catch(err) {
      throw err
      return false
    }
  }

  console.info("Starting direct link")
  link = new linkModules.direct(worldOptions)

  start()
}
async function networkLink(gameCode, username) {
  if (!linkModules.network) {
    try {
      linkModules.network = (await import('/link/NetworkLink.js')).default
    } catch(err) {
      throw err
      return false
    }
  }

  console.info(`Starting network link w/ code: ${gameCode} & username: ${username}`)
  link = new linkModules.network(gameCode, username)

  start()
}

window.Voxilon = { renderer, Input, GUI, hud, link, stop, animate };