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

  /** Sets this player's controller */
  setController(type, ...options) {
    if(type === "player") {
      this.character = options[0]
    } else if(type === "contraption") {
      // ?
    }
  }
}
