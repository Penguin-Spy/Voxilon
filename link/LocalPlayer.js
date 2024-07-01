/** @typedef {import('link/DirectLink.js').default} DirectLink */
/** @typedef {import('client/Client.js').default} Client */

import Player from 'link/Player.js'

export default class LocalPlayer extends Player {
  /**
   * @param {DirectLink} link
   * @param {Client} client
   */
  constructor(link, client) {
    super(link, client.username, client.uuid)
    this.client = client
  }

  /** Sets this player's controller
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {CharacterServerBody|ControlSeatServer} thing  The thing being controlled.
   */
  setController(type, thing) {
    super.setController(type, thing)
    if(type === "player") {
      this.client.setController(type, this.link.world.getClientBodyByID(thing.id))
    } else if(type === "contraption") {
      //this.client.setController(type, this.link.world.getClientComponentByID(thing.id))
      throw new Error("not implemented")
    }
  }

  /** Sets the state of this player's controller
   * @param {boolean} dampeners
   * @param {boolean} jetpack
   */
  setControllerState(dampeners, jetpack) {
    this.client.activeController.setState(dampeners, jetpack)
  }

  /** Sets this player's current Screen (the main GUI window)
   * @param {string} type     The Screen type, or `false` to close any open Screen.
   * @param {...any} options  Additional parameters to pass to the Screen.
   */
  setScreen(type, ...options) {
    super.setScreen(type, ...options)
    this.client.setScreen(type, ...options)
  }

  /** Sends an update message to the player's current Screen
   * @param {string} action The action of the update
   * @param {object} data   Serializable data for the update
   */
  sendScreenUpdate(action, data) {
    this.client.receiveScreenUpdate(action, data)
  }
}

