/** @typedef {import('engine/server/CharacterServerBody.js').default} CharacterServerBody */
/** @typedef {import('link/Link.js').default} Link */

export default class Player {
  /** @type {CharacterServerBody?} */
  character
  /** @type {ControlSeatServer?} */
  controlSeat

  /**
   * @param {Link} link
   * @param {string} username
   * @param {string} uuid
   */
  constructor(link, username, uuid) {
    this.link = link
    this.username = username
    this.uuid = uuid
    this.character = null
    this.controlSeat = null
  }

  /** Sets this player's controller
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {CharacterServerBody|ControlSeatServer} thing  The thing being controlled.
   */
  setController(type, thing) {
    if(this.character) this.character.detachPlayer()
    this.character = null
    if(this.controlSeat) this.controlSeat.detachPlayer()
    this.controlSeat = null
    if(type === "player") {
      this.character = thing
      this.character.attachPlayer(this)
    } else if(type === "contraption") {
      this.controlSeat = thing
      this.controlSeat.attachPlayer(this)
    }
  }

  /** Sets the state of this player's controller
   * @param {boolean} dampeners
   * @param {boolean} jetpack
   */
  setControllerState(dampeners, jetpack) {

  }

  /** Sets this player's current Screen (the main GUI window)
   * @param {string} type     The Screen type, or `false` to close any open Screen.
   * @param {...any} options  Additional parameters to pass to the Screen.
   */
  setScreen(type, ...options) {

  }

  /** Sends an update message to the player's current Screen
   * @param {string} action The action of the update
   * @param {object} data   Serializable data for the update
   */
  sendScreenUpdate(action, data) {

  }
}

