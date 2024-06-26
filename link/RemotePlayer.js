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

  /** Sets this player's controller
   * @param {string} type     The controller type; one of `"player"`, `"contraption"`.
   * @param {...any} options  Additional parameters to pass to the controller initalization.
   */
  setController(type, ...options) {
    super.setController(type, ...options)
    this.sendSyncPacket(PacketEncoder.SET_CONTROLLER_STATE(type, ...options))
  }

  /** Sets this player's current Screen (the main GUI window)
   * @param {string} type     The Screen type, or `false` to close any open Screen.
   * @param {...any} options  Additional parameters to pass to the Screen.
   */
  setScreen(type, ...options) {
    console.error(type, ...options)
    throw new Error("setScreen not implemented for RemotePlayer")
    super.setScreen(type, ...options)
    //    this.client.setScreen(type, ...options)
  }

  /** Sends an update message to the player's current Screen
   * @param {string} action The action of the update
   * @param {object} data   Serializable data for the update
   */
  sendScreenUpdate(action, data) {
    console.error(action, data)
    throw new Error("sendScreenUpdate not implemented for RemotePlayer")
  }
}

