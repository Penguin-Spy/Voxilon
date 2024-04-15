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
}
