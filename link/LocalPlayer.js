import Player from 'link/Player.js'
import PlayerController from 'client/PlayerController.js'

export default class LocalPlayer extends Player {
  constructor(link, client) {
    super(link, client.username, client.uuid)
    this.client = client
  }

  /** Sets this player's controller
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {...any} options  Additional parameters to pass to the controller initalization.
   */
  setController(type, ...options) {
    super.setController(type, ...options)
    this.client.setController(type, ...options)
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

