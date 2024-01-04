import PlayerController from '/client/PlayerController.js'
import ContraptionController from '/client/ContraptionController.js'

class ControllerManager {
  attachControllers(link, hud, renderer) {
    this.controllers = {
      "player": new PlayerController(this, link, hud, renderer),
      "contraption": new ContraptionController(this, link, hud, renderer)
    }
  }

  setActiveController(type, ...options) {
    if(this.activeController) { this.activeController.deactivate() }
    this.activeController = this.controllers[type]
    this.activeController.activate(...options)
  }
}

export default new ControllerManager()
