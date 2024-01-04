/* main.js © Penguin_Spy 2023
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Renderer from '/client/Renderer.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import HUD from '/client/HUD.js'
import ControllerManager from '/client/ControllerManager.js'
import Debug from '/client/Debug.js'

import main_menu from '/client/screens/main_menu.js'

// debug interface object
const Voxilon = { Input, GUI, Debug }

// top-level engine objects
let link, renderer, hud

// generate a UUID for the player if one does not exist
let uuid = localStorage.getItem("player_uuid")
if(uuid === null) {
  uuid = crypto.randomUUID()
  localStorage.setItem("player_uuid", uuid)
}
console.log("player uuid", uuid)


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
  try {
    ControllerManager.activeController.preRender(deltaTime)
    hud.update()

    link.step(deltaTime)
  } catch(e) {
    GUI.showError("Error occured while ticking", e)
    return
  }

  // --- Render ---
  try {
    Debug.update(deltaTime)
    link.preRender()
    renderer.render()
  } catch(e) {
    GUI.showError("Error occured while rendering", e)
    return
  }

  // only request the next frame if this one succeded
  renderRequest = requestAnimationFrame(animate)
}

function start() {
  // initalize engine
  renderer = new Renderer(link)
  Input.useCanvas(renderer.getCanvas())
  hud = new HUD(link)

  //link.attachControllers(hud, renderer)
  ControllerManager.attachControllers(link, hud, renderer)

  Voxilon.link = link
  Voxilon.renderer = renderer
  Voxilon.hud = hud
  Voxilon.manager = ControllerManager

  Debug.attach(link, hud)

  const characterBody = link.world.getPlayersCharacterBody(uuid) // both links will have loaded the world enough to get the player's character
  ControllerManager.setActiveController("player", characterBody)

  GUI.clearScreen()
  GUI.cursor = "default"
  hud.show()
  Input.enablePointerLock()
  Input.requestPointerLock()

  requestAnimationFrame(animate)
}

function stop() {
  cancelAnimationFrame(renderRequest)
}

/* --- Direct/Network link --- */

const linkModules = {}

async function directLink(button, worldOptions) {
  button.disabled = true
  GUI.cursor = "loading"
  if(!linkModules.direct) {
    try {
      linkModules.direct = (await import('/link/DirectLink.js')).default
    } catch(err) {
      button.disabled = false
      GUI.cursor = "default"
      throw err
    }
  }

  console.info("Starting direct link")
  try {
    worldOptions.uuid = uuid
    link = new linkModules.direct(worldOptions)
    start()
  } catch(e) {
    GUI.showError("Error when starting direct link", e)
  }
}
async function networkLink(button, gameCode, username) {
  button.disabled = true
  GUI.cursor = "loading"
  if(!linkModules.network) {
    try {
      linkModules.network = (await import('/link/NetworkLink.js')).default
    } catch(err) {
      button.disabled = false
      GUI.cursor = "default"
      throw err
    }
  }

  console.info(`Starting network link w/ code: ${gameCode} & username: ${username}`)
  try {
    link = new linkModules.network(gameCode, username)
    await link.ready
    start()
  } catch(e) {
    GUI.showError("Error when starting network link", e)
  }
}


GUI.loadScreen(main_menu, "title", { directLink, networkLink })

// remove loading error handler
window.onerror = undefined;

// debugging interface
Voxilon.animate = animate
Voxilon.stop = stop
window.Voxilon = Voxilon //{  stop, animate, };
