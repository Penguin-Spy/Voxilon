/** @typedef {import('engine/bodies/CharacterBody.js').default} CharacterBody */

export default class Player {
  /** @type {CharacterBody?} */
  character

  constructor(link, username, uuid) {
    this.link = link
    this.username = username
    this.uuid = uuid
    this.character = null
  }

  /** Sets this player's controller
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {...any} options  Additional parameters to pass to the controller initalization.
   */
  setController(type, ...options) {
    if(type === "player") {
      this.character = options[0]
    } else if(type === "contraption") {
      // ?
    }
  }
  
  /** Sets this player's current Screen (the main GUI window)
   * @param {string} type     The Screen type, or `false` to close any open Screen.
   * @param {...any} options  Additional parameters to pass to the Screen.
   */
  setScreen(type, ...options) {
  
  }
}

