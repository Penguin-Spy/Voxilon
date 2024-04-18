import Player from 'link/Player.js'
import PeerConnection from 'link/PeerConnection.js'
import PacketEncoder from 'link/PacketEncoder.js'

export default class RemotePlayer extends Player {
  constructor(link, username, uuid, netID) {
    super(link, username, uuid)
    this.netID = netID
    
    let readyResolve
    this.ready = new Promise((resolve, reject) => {
      readyResolve = resolve
    })
    
    this.pc = new PeerConnection(link.ws, netID)

    this.dataChannel = this.pc.createDataChannel("link", {
      ordered: false,
      negotiated: true, id: 0
    })
    this.dataChannel.addEventListener("close", e => {
      console.info(`[dataChannel:${this.netID}] closed`, e)
    })
    this.dataChannel.addEventListener("message", ({ data }) => {
      this.link.handlePacket(this, data)
    })
    this.dataChannel.addEventListener("open", e => {
      console.info(`[dataChannel:${this.id}] opened`)
      readyResolve()
    })
  }

  /** Sends an already-encoded synchronization packet */
  sendSyncPacket(packet) {
    this.dataChannel.send(packet)
  }
  
  /** Sets this player's controller */
  setController(type, ...options) {
    this.sendSyncPacket(PacketEncoder.SET_CONTROLLER_STATE(type, ...options))
    if(type === "player") {
      this.body = options[0]
    }
  }
}

