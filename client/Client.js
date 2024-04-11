import Renderer from '/client/Renderer.js'
import HUD from '/client/HUD.js'
import Input from '/client/Input.js'
import Debug from '/client/Debug.js'

import PlayerController from '/client/PlayerController.js'
import ContraptionController from '/client/ContraptionController.js'

export default class Client {
  /** @type {PlayerController|ContraptionController|undefined} */
  activeController

  constructor() {
    // generate a UUID for the player if one does not exist
    this.uuid = localStorage.getItem("player_uuid")
    if(this.uuid === null) {
      // generates a UUID by asking for a blob url (which are always uuids). doesn't use crypto.randomUUID() because it doesn't work in non-secure contexts
      const url = URL.createObjectURL(new Blob())
      this.uuid = url.substr(-36)
      URL.revokeObjectURL(url)
      localStorage.setItem("player_uuid", this.uuid)
    }
    console.log("[client] player uuid", this.uuid)
  }

  attach(link) {
    this.link = link

    this.renderer = new Renderer(link)
    Input.useCanvas(this.renderer.getCanvas())
    this.hud = new HUD(link)

    Debug.attach(this, link, this.hud)

    this.controllers = {
      "player": new PlayerController(link, this.hud, this.renderer),
      "contraption": new ContraptionController(link, this.hud, this.renderer)
    }

  }

  /**
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {...any} options  Additional parameters to pass to the controller initalization.
   */
  setController(type, ...options) {
    if(this.activeController) { this.activeController.deactivate() }
    this.activeController = this.controllers[type]
    this.activeController.activate(...options)
  }

  /**
   * @param {string} type  The GUI type. One of `"example1"`, `"example_two"`, or `false` to close any open GUI.
   * @param {...any} state Additional parameters to pass to the GUI.
   */
  setGUI(type, ...state) {

  }
}
