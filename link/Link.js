const DT = 1 / 60

export default class Link {
  /* --- Identical between Direct & Network links ---- */
  // TODO: don't duplicate this code? have a parent class for both links? some other method?

  // packet event handling
  on(event, callback) {
    this._callbacks[event] = callback
  }
  emit(event, data) {
    const callback = this._callbacks[event]
    if(typeof callback === "function") {
      callback(data)
    }
  }

  step(deltaTime) {
    this.accumulator += deltaTime
    let maxSteps = 10;

    while(this.accumulator > DT && maxSteps > 0) {
      this._world.step(DT)
      this.accumulator -= DT
      maxSteps--
    }

    if(this.accumulator > DT) {  // remove extra steps worth of time that could not be processed
      console.warn(`Warning: stepping world took too many steps to catch up! Simulation is behind by ${Math.floor(this.accumulator / DT)}ms`)
      this.accumulator = this.accumulator % DT
    }

  }
}