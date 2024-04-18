export default class Player {
  constructor(link, username, uuid) {
    this.link = link
    this.username = username
    this.uuid = uuid
  }
  
  /** Sends an already-encoded synchronization packet */
  sendSyncPacket(packet) {
    throw new Error("sendSyncPacket not implemented")
  }
  
  /** Sets this player's controller */
  setController(type, ...options) {
    throw new Error("setController not implemented")
  }
}

