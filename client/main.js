import Renderer from '/client/Renderer.js'
import Input from '/client/Input.js'
import GUI from '/client/GUI.js'
import HUD from '/client/HUD.js'
import CannonDebugger from 'cannon-es-debugger'

import main_menu from '/client/screens/main_menu.js'

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
    link.playerController.updateRotation(deltaTime)
    hud.update()

    link.step(deltaTime)
    if(physicsDebug.enabled) {
      physicsDebug.debugger.update()
    }
  } catch(e) {
    GUI.showError("Error occured while ticking", e)
    return
  }

  // --- Render ---
  try {
    renderSpan.innerText = `FPS: ${(1 / deltaTime).toFixed(2)}`
    const _velocity = link.playerBody.velocity
    const _position = link.playerBody.position
    positionSpan.innerHTML = ` X: ${_position.x.toFixed(3)}  Y: ${_position.y.toFixed(3)}  Z: ${_position.z.toFixed(3)}`
    velocitySpan.innerHTML = `vX: ${_velocity.x.toFixed(3)} vY: ${_velocity.y.toFixed(3)} vZ: ${_velocity.z.toFixed(3)}`

    renderer.render()
  } catch(e) {
    GUI.showError("Error occured while rendering", e)
    return
  }

  // only request the next frame if this one succeded
  renderRequest = requestAnimationFrame(animate)
}

function start() {
  window.Voxilon.link = link

  link.playerController.attach(link, hud, renderer)
  renderer.attach(link)
  hud.attach(link)

  // debugger
  physicsDebug.debugger = new CannonDebugger(link.world._scene, link.world._physics, {
    onInit: (body, mesh) => {
      if(body === link.playerBody.rigidBody) {
        mesh.material = false // don't render a wireframe for the player's body (just obscures vision)
        return
      }
      physicsDebug.meshes.push(mesh)
      mesh.visible = physicsDebug.enabled
      mesh.layers
    }
  })

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
let link  // current link, may be undefined

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


// initalize engine
const renderer = new Renderer();
Input.useCanvas(renderer.getCanvas());
const hud = new HUD();

GUI.loadScreen(main_menu, "title", { directLink, networkLink })

const debugFrame = GUI.addFrame("gui-debug bg bg-bottom bg-right")
const renderSpan = document.createElement("span")

const physicsDebugDiv = document.createElement("div")
const positionSpan = document.createElement("span")
const velocitySpan = document.createElement("span")
physicsDebugDiv.appendChild(positionSpan)
physicsDebugDiv.appendChild(document.createElement("br"))
physicsDebugDiv.appendChild(velocitySpan)

debugFrame.appendChild(renderSpan)
debugFrame.appendChild(physicsDebugDiv)

const physicsDebug = {
  enabled: false,
  meshes: [],
  toggle: function () {
    physicsDebug.enabled = !physicsDebug.enabled
    physicsDebug.meshes.forEach(m => m.visible = physicsDebug.enabled)
  }
}
Input.on("debug_physics_wireframe", physicsDebug.toggle)

Input.on("debug_gravity_mode", function () {
  link.world.orbitalGravityEnabled = !link.world.orbitalGravityEnabled
  if(link.world.orbitalGravityEnabled) {
    link.world._physics.gravity.y = 0
    hud.showChatMessage("[debug] orbital gravity enabled")
  } else {
    link.world._physics.gravity.y = -9.82 // m/s²
    hud.showChatMessage("[debug] orbital gravity disabled")
  }
})

// remove loading error handler
window.onerror = undefined;

// debugging interface
window.Voxilon = { renderer, Input, GUI, hud, stop, animate, physicsDebug };