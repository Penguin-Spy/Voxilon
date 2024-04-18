import { DT } from 'engine/util.js'

export default class Link {
  #accumulator = 0

  constructor() {
    Object.defineProperties(this, {
      callbacks: { enumerable: true, value: {} }
    })
  }

  // packet event handling
  on(event, callback) {
    this.callbacks[event] = callback
  }
  emit(event, data) {
    const callback = this.callbacks[event]
    if(typeof callback === "function") {
      callback(data)
    }
  }

  preRender() {
    this.world.preRender()
  }

  step(deltaTime) {
    this.#accumulator += deltaTime
    let maxSteps = 10;

    while(this.#accumulator > DT && maxSteps > 0) {
      this.world.step()
      this.postUpdate()
      this.#accumulator -= DT
      maxSteps--
    }

    if(this.#accumulator > DT) {  // remove extra steps worth of time that could not be processed
      console.warn(`Warning: stepping world took too many steps to catch up! Simulation is behind by ${Math.floor(this.#accumulator / DT)}ms`)
      this.#accumulator = this.#accumulator % DT
    }

  }

  postUpdate() {
  }
  
  /* --- Link interface methods --- */
  // all of these just throw because they must be implemented by the subclasses DirectLink and NetworkLink

  /** Send a chat message as this player.
   * @param {string} msg  the message to send. uses the Link's username.  */
  sendChat(msg) {
    throw new TypeError("sendChat not implemented")
  }
  
  /** Informs the server that the player interacted with a component.
   * @param {Component} component The component that was interacted with
   * @param {string} action       The type of interaction, one of `open_gui`, `sit`
   */
  interact(component, action) {
    throw new TypeError("interact not implemented")
  }

  // --- Building ---

  // debugging
  newTestBody(stuff) {
    throw new TypeError("newTestBody not implemented")
  }

  /**
   * Request to create a new standalone contraption in the world
   * @param {THREE.Vector3}    position       the contraption position
   * @param {THREE.Quaternion} quaternion     the contraption's own rotation
   * @param {object}           firstComponent data for the first component of the contraption
   */
  newStandaloneContraption(position, quaternion, firstComponent) {
    throw new TypeError("newStandaloneContraption not implemented")
  }

  /**
   * Request to create a new anchored contraption (attached to a celestial body)
   *
   * @param {CelestialBody}    parent         the celestial body that this contraption is attached to
   * @param {THREE.Vector3}    positionOffset the contraption position relative to the celestial body
   * @param {THREE.Quaternion} quaternion     the contraption's own rotation
   * @param {object}           firstComponent data for the first component of the contraption
   */
  newAnchoredContraption(parent, positionOffset, quaternion, firstComponent) {
    throw new TypeError("newAnchoredContraption not implemented")
  }

  /**
   * Request to add a component to a contraption
   * @param {Contraption} contraption the contraption to add to
   * @param {object} component        data for the new component
   */
  editContraption(contraption, component) {
    throw new TypeError("editContraption not implemented")
  }
}
