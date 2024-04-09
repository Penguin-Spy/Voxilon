/* main.js © Penguin_Spy 2023-2024
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Client from '/client/Client.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import Debug from '/client/Debug.js'

import main_menu from '/client/screens/main_menu.js'

// debug interface object
const Voxilon = { Input, GUI, Debug }

// top-level engine objects
let client = Voxilon.client = new Client()
let link, renderer, hud

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
    client.activeController.preRender(deltaTime)
    renderer.render()
  } catch(e) {
    GUI.showError("Error occured while rendering", e)
    return
  }

  // only request the next frame if this one succeded
  renderRequest = requestAnimationFrame(animate)
}

function start() {
  Voxilon.link = link
  // these are populated after the link's constructor attaches the client to itself
  renderer = client.renderer
  hud = client.hud

  GUI.clearScreen()
  GUI.cursor = "default"
  hud.show()
  Input.enablePointerLock()
  Input.requestPointerLock()

  requestAnimationFrame(animate)
}

function stop() {
  cancelAnimationFrame(renderRequest)
  link.stop()
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
    link = new linkModules.direct(client, worldOptions)
    start()
  } catch(e) {
    GUI.showError("Error when starting direct link", e)
  }
}
async function networkLink(button, target, username) {
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

  console.info(`Starting network link with target: '${target}' & username: '${username}'`)
  try {
    link = new linkModules.network(client, target, username)
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
