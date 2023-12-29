import PlayerController from '/client/PlayerController.js'
import ContraptionController from '/client/ContraptionController.js'

const DT = 1 / 60

export default class Link {
  #accumulator = 0

  constructor(username) {
    Object.defineProperties(this, {
      callbacks: { enumerable: true, value: {} },
      username: { enumerable: true, value: username }
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

  attachControllers(hud, renderer) {
    this.controllers = {
      "player": new PlayerController(this, hud, renderer),
      "contraption": new ContraptionController(this, hud, renderer)
    }
  }

  setActiveController(type, ...options) {
    if(this.activeController) { this.activeController.deactivate() }
    this.activeController = this.controllers[type]
    this.activeController.activate(...options)
  }

  preRender() {
    this.world.preRender()
  }

  step(deltaTime) {
    this.#accumulator += deltaTime
    let maxSteps = 10;

    while(this.#accumulator > DT && maxSteps > 0) {
      this.world.step(DT)
      this.#accumulator -= DT
      maxSteps--
    }

    if(this.#accumulator > DT) {  // remove extra steps worth of time that could not be processed
      console.warn(`Warning: stepping world took too many steps to catch up! Simulation is behind by ${Math.floor(this.#accumulator / DT)}ms`)
      this.#accumulator = this.#accumulator % DT
    }

  }
}
