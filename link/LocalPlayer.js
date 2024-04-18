import Player from 'link/Player.js'

export default class LocalPlayer extends Player {
  constructor(link, client) {
    super(link, client.username, client.uuid)
    this.client = client
  }
  
  /** Sets this player's controller */
  setController(type, ...options) {
    this.client.setController(type, ...options)
  }
}

