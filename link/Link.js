import { DT } from 'engine/util.js'

export default class Link {
  _world
  #accumulator = 0

  constructor() {
    this.callbacks = {}
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

  step(deltaTime) {
    this.#accumulator += deltaTime
    let maxSteps = 10;

    while(this.#accumulator > DT && maxSteps > 0) {
      this._world.step()
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
    throw new TypeError(`sendChat not implemented for ${this.constructor.name}`)
  }

  /** Informs the server that the player interacted with a component.
   * @param {Component} component The component that was interacted with
   * @param {boolean} alternate   True if the 'alternate' interaction action should be taken (e.g. open gui instead of activating component)
   */
  interact(component, alternate) {
    throw new TypeError(`interact not implemented for ${this.constructor.name}`)
  }

  /** Sends a packet updating the input state of the controller
   * @param {-1|0|1} front_back
   * @param {-1|0|1} left_right
   * @param {-1|0|1} up_down
   * @param {number} pitch_x    adjustment of pitch (`-1|0|1`) for contraption, quaternion x for character
   * @param {number} yaw_y
   * @param {number} roll_z
   * @param {number} [w]
   */
  sendInputState(front_back, left_right, up_down, pitch_x, yaw_y, roll_z, w) {
    throw new TypeError(`sendInputState not implemented for ${this.constructor.name}`)
  }

  // --- Screens ---

  /** Performs an action on a component due to interacting with a screen (click a button, component does something)
   * @param {Component} component The component to perform an action on
   * @param {string} action       The action to perform on the component
   * @param {object} data         Arbitrary, serializable data to be passed to the component's screen action handler
   */
  screenAction(component, action, data) {
    throw new TypeError(`screenAction not implemented for ${this.constructor.name}`)
  }

  // --- Building ---

  // debugging
  newTestBody(stuff) {
    throw new TypeError(`newTestBody not implemented for ${this.constructor.name}`)
  }

  /**
   * Request to create a new standalone contraption in the world
   * @param {THREE.Vector3}    position       the contraption position
   * @param {THREE.Quaternion} quaternion     the contraption's own rotation
   * @param {object}           firstComponent data for the first component of the contraption
   */
  newStandaloneContraption(position, quaternion, firstComponent) {
    throw new TypeError(`newStandaloneContraption not implemented for ${this.constructor.name}`)
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
    throw new TypeError(`newAnchoredContraption not implemented for ${this.constructor.name}`)
  }

  /**
   * Request to add a component to a contraption
   * @param {Contraption} contraption the contraption to add to
   * @param {object} component        data for the new component
   */
  editContraption(contraption, component) {
    throw new TypeError(`editContraption not implemented for ${this.constructor.name}`)
  }
}
