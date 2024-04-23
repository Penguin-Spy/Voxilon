import Player from 'link/Player.js'
import PlayerController from 'client/PlayerController.js'

export default class LocalPlayer extends Player {
  constructor(link, client) {
    super(link, client.username, client.uuid)
    this.client = client
  }

  /** Sets this player's controller */
  setController(type, ...options) {
    this.client.setController(type, ...options)
  }

  /** Gets the character body of this player, or `null` if there is no relevant character. */
  getCharacter() {
    if(this.client.activeController instanceof PlayerController) {
      return this.client.activeController.body
    } else {
      return null
    }
  }
}

