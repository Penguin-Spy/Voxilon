/* main.js © Penguin_Spy 2023-2024
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Client from 'client/Client.js'
import Input from 'client/Input.js'
import GUI from 'client/GUI.js'
import Debug from 'client/Debug.js'

import MainMenuScreen from 'client/screens/main_menu/MainMenuScreen.js'

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
    showError("Error occured while ticking", e)
    return
  }

  // --- Render ---
  try {
    Debug.update(deltaTime)
    link.preRender()
    client.activeController.preRender(deltaTime)
    renderer.render()
  } catch(e) {
    showError("Error occured while rendering", e)
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
  Input.stop()
  if(link) link.stop()
}

// displays an error over the whole screen, stops game.
// only for use with unhandled/catastrophic errors
function showError(context, error) {
  console.error(context + " -", error)
  stop()

  const gui = document.querySelector("#gui")
  // clear focus from gui main frame
  gui.children[0]?.shadowRoot?.activeElement?.blur()

  const errorFrame = document.createElement("div")
  errorFrame.setAttribute("class", "gui-messages error-screen")
  gui.prepend(errorFrame)

  function newMessage(message, type) {
    const element = errorFrame.appendChild(document.createElement("span"))
    element.innerText = message
    if(type) element.className = type
  }

  newMessage(`${context} - ${error.name}: ${error.message}`, "error")
  for(const line of error.stack.split("\n")) {
    newMessage(line, "stacktrace")
    if(line.startsWith("FrameRequestCallback")) {  // don't fill the rest of the screen with the animate callback trace
      newMessage("...", "stacktrace")
      break
    }
  }
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
    showError("Error when starting direct link", e)
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
    showError("Error when starting network link", e)
  }
}

GUI.loadScreen(new MainMenuScreen(directLink, networkLink))

// remove loading error handler
window.onerror = undefined

// debugging interface
Voxilon.animate = animate
Voxilon.stop = stop
Voxilon.showError = showError
window.Voxilon = Voxilon
