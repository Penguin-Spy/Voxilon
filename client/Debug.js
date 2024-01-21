import Link from "/link/Link.js"
import HUD from "/client/HUD.js"

import * as THREE from 'three'
import CannonDebugger from 'cannon-es-debugger'
import Input from "/client/Input.js"
import GUI from "/client/GUI.js"

function generateDebugRow(name, table) {
  const row = document.createElement("tr")
  const header = document.createElement("th")
  header.scope = "row"
  header.innerHTML = name
  const elements = [
    document.createElement("td"),
    document.createElement("td"),
    document.createElement("td")
  ]
  row.appendChild(header)
  for(const e of elements) {
    row.appendChild(e)
  }
  table.appendChild(row)
  return elements
}

function formatNumber(prefix, num) {
  return `${prefix}:${num >= 0 ? " " : ""}${num.toFixed(3)}`
}

class Debug {
  /** @type {Link} */
  #link
  /** @type {HUD} */
  #hud
  /** @type {THREE.Mesh[]} */
  #wireframeMeshes
  /** @type {Map<CANNON.Body,THREE.Mesh>} */
  #rigidBodyPosMeshes
  /** @type {boolean} */
  #physicsWireframeEnabled

  #debugFrame; #renderSpan; #positionDebug; #velocityDebug; #angularVelocityDebug; #thrustOutputDebug; #controllerManager

  constructor() {
    this.#wireframeMeshes = []
    this.#rigidBodyPosMeshes = new Map()
    this.#physicsWireframeEnabled = false

    // debug text in the top right
    this.#debugFrame = GUI.addFrame("gui-debug bg bg-bottom bg-right")
    this.#renderSpan = document.createElement("span")

    const physicsDebugTable = document.createElement("table")
    this.#positionDebug = generateDebugRow("pos", physicsDebugTable)
    this.#velocityDebug = generateDebugRow("vel", physicsDebugTable)
    this.#angularVelocityDebug = generateDebugRow("ang", physicsDebugTable)
    this.#thrustOutputDebug = generateDebugRow("thr", physicsDebugTable)

    this.#debugFrame.appendChild(this.#renderSpan)
    this.#debugFrame.appendChild(physicsDebugTable)

    // debug point visualization
    this.points = {
      "green": new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: "#00ff00" })),
      "red": new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: "#ff0000" })),
      "blue": new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: "#0000ff" })),
      "yellow": new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: "#ffff00" }))
    }

    Input.on("debug_physics_wireframe", () => {
      if(!this.#hud) return;
      this.#physicsWireframeEnabled = !this.#physicsWireframeEnabled
      this.#hud.showChatMessage("[debug] physics wireframe " + (this.#physicsWireframeEnabled ? "enabled" : "disabled"))

      this.#wireframeMeshes.forEach(m => m.visible = this.#physicsWireframeEnabled)
      this.#rigidBodyPosMeshes.forEach(m => m.visible = this.#physicsWireframeEnabled)
    })

    Input.on("debug_save", async () => {
      let worldString
      try {
        const worldData = this.#link.world.serialize()
        worldString = JSON.stringify(worldData)
      } catch(e) {
        this.#hud.showChatMessage("[debug] failed to save world, see console")
        console.error(`error while saving world - `, e)
        return
      }
      try {
        await navigator.clipboard.writeText(worldString)
        this.#hud.showChatMessage("[debug] saved world to clipboard!")
      } catch(e) {
        console.error(`error while writing to clipboard -`, e)
        console.info(worldString)
        this.#hud.showChatMessage("[debug] saved world to console")
      }
    })
  }

  /**
   * @param {Link} link
   * @param {HUD} hud
   */
  attach(link, hud, controllerManager) {
    this.#link = link
    this.#hud = hud
    this.#controllerManager = controllerManager

    const scene = link.world.scene
    const physics = link.world.physics

    this.debugger = new CannonDebugger(scene, physics, {
      /**
       * @param {CANNON.Body} body
       * @param {THREE.Mesh} mesh
       */
      onInit: (body, mesh) => {
        this.#wireframeMeshes.push(mesh)
        mesh.visible = this.#physicsWireframeEnabled

        // add point for center of mass (but only once)
        if(!this.#rigidBodyPosMeshes.has(body)) {
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: "#00aaaa" }))
          this.#rigidBodyPosMeshes.set(body, mesh)
          scene.add(mesh)
        }
      }
    })

    for(const point of Object.values(this.points)) {
      scene.add(point)
    }

    Input.on("debug_gravity_mode", function () {
      const world = link.world
      world.orbitalGravityEnabled = !world.orbitalGravityEnabled
      if(world.orbitalGravityEnabled) {
        physics.gravity.y = 0
        hud.showChatMessage("[debug] orbital gravity enabled")
      } else {
        physics.gravity.y = -9.82 // m/s²
        hud.showChatMessage("[debug] orbital gravity disabled")
      }
    })

    /*Input.on("debug_noclip", () => {
      const body = link.playerBody
      if(body) {
        body.setNoclip(!body.noclip)
        hud.showChatMessage("[debug] noclip " + (body.noclip ? "enabled" : "disabled"))
        if(body.noclip && !link.playerController.jetpackActive) {
          link.playerController.toggleJetpack()
        }
      }
    })*/
  }

  update(deltaTime) {
    this.#renderSpan.innerText = `FPS: ${(1 / deltaTime).toFixed(2)}`

    const body = this.#controllerManager.activeController?.body
    if(body) {
      this.#positionDebug[0].innerText = formatNumber("x", body.position.x)
      this.#positionDebug[1].innerText = formatNumber("y", body.position.y)
      this.#positionDebug[2].innerText = formatNumber("z", body.position.z)

      this.#velocityDebug[0].innerText = formatNumber("X", body.velocity.x)
      this.#velocityDebug[1].innerText = formatNumber("Y", body.velocity.y)
      this.#velocityDebug[2].innerText = formatNumber("Z", body.velocity.z)

      this.#angularVelocityDebug[0].innerText = formatNumber("p", body.angularVelocity.x)
      this.#angularVelocityDebug[1].innerText = formatNumber("y", body.angularVelocity.y)
      this.#angularVelocityDebug[2].innerText = formatNumber("r", body.angularVelocity.z)

      const tm = this.#controllerManager.activeController?.thrustManager
      if(tm) {
        this.#thrustOutputDebug[0].innerText = formatNumber("x", tm._logicalAcceleration.x)
        this.#thrustOutputDebug[1].innerText = formatNumber("y", tm._logicalAcceleration.y)
        this.#thrustOutputDebug[2].innerText = formatNumber("z", tm._logicalAcceleration.z)
      }
    }

    if(this.#physicsWireframeEnabled) {
      this.debugger.update()
      for(const [body, mesh] of this.#rigidBodyPosMeshes) {
        mesh.position.copy(body.position)
      }
    }
  }

  /**
   * @param {"green"|"red"|"blue"|"yellow"} name
   * @param {THREE.Vector3} pos
   */
  setPointPosition(name, pos) {
    this.points[name].position.copy(pos)
  }
}

export default new Debug()
