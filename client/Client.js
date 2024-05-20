import Renderer from 'client/Renderer.js'
import HUD from 'client/HUD.js'
import Input from 'client/Input.js'
import GUI from 'client/GUI.js'
import Debug from 'client/Debug.js'

import PlayerController from 'client/PlayerController.js'
import ContraptionController from 'client/ContraptionController.js'

import ControlSeatScreen from 'client/screens/control_seat/ControlSeatScreen.js'

const screens = {
  "control_seat": ControlSeatScreen
}

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
    this.username = "localplayer"
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

  /** Sets this player's controller
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {...any} options  Additional parameters to pass to the controller initalization.
   */
  setController(type, ...options) {
    if(this.activeController) { this.activeController.deactivate() }
    this.activeController = this.controllers[type]
    this.activeController.activate(...options)
  }

  /** Sets this player's current Screen (the main GUI window)
   * @param {string} type     The Screen type, or `false` to close any open Screen.
   * @param {...any} options  Additional parameters to pass to the Screen.
   */
  setScreen(type, ...options) {
    if(type) {
      const screen = new screens[type](...options)
      GUI.showScreen(screen)
    } else {
      GUI.clearScreen()
    }
  }
}
