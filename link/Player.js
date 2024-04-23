export default class Player {
  constructor(link, username, uuid) {
    this.link = link
    this.username = username
    this.uuid = uuid
  }
  
  /** Sends an already-encoded synchronization packet */
  sendSyncPacket(packet) {
    throw new Error(`sendSyncPacket not implemented for ${this.constructor.name}`)
  }
  
  /** Sets this player's controller */
  setController(type, ...options) {
    throw new Error(`setController not implemented for ${this.constructor.name}`)
  }
  
  /** Gets the character body of this player, or `null` if there is no relevant character. */
  getCharacter() {
    throw new Error(`getCharacter not implemented for ${this.constructor.name}`)
  }
}

