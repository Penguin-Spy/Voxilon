import World from '../common/World.js'
import PlayerBody from '/common/bodies/Player.js'
import PeerConnection from '/link/PeerConnection.js'
import PacketEncoder from '/link/PacketEncoder.js'
import PacketDecoder from '/link/PacketDecoder.js'

export default class NetworkLink {
  constructor(code, username) {
    this._username = username // maybe load from LocalStorage? (prefill input of gui)

    this._callbacks = {}

    // create/load world
    this._world = new World()

    // create player's body
    this._playerBody = new PlayerBody()
    this._playerBody.position = { x: 0, y: 1, z: 0 }
    this._world.addBody(this._playerBody)

    // join host

    // open a WebRTC data channel with the host of the specified game
    // TODO: how to handle game codes (client hosting) vs URIs of dedicated hosts

    //this.pc = new RTCPeerConnection()
    this.ws = new WebSocket(`wss://${window.location.hostname}/signal?code=${code}`)

    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      console.log("[link Receive]", data)
      switch (data.type) {
        case "join":
          if (data.approved) { // request to join was approved, continue with WebRTC
            this.pc = new PeerConnection(this.ws)

            this.dataChannel = this.pc.createDataChannel("link", {
              ordered: false,
              negotiated: true, id: 0
            })
            this.dataChannel.onopen = e => { console.info("[dataChannel] open") }
            this.dataChannel.onclose = e => { console.info("[dataChannel] close") }
            this.dataChannel.onmessage = ({ data }) => { this._handlePacket(data) }

          } else { // it was denied, close websocket
            this.ws.close(1000, "Join request not approved")
            console.info("Join request not approved")
          }
          break;
        default:
          break;
      }
    }

    // finally, request to join
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: "join",
        username: this.username
      }))
    }
    this.ws.onclose = ({ code, reason }) => {
      console.warn(`Websocket closed | ${code}: ${reason}`)
    }
  }

  get playerBody() { return this._playerBody }
  //get world() { console.error("accessing Link.world directly!!") }
  get world() { return this._world }
  get username() { return this._username }

  /* --- Network Link methods --- */
  _handlePacket(data) {
    console.log(`[dataChannel] ${data}`)
    const packet = PacketDecoder.chat(data)
    this.emit('chat_message', packet)
  }

  send(packet) {
    this.dataChannel.send(packet)
  }

  /* --- Link interface methods --- */

  playerMove(velocity) {  // vector of direction to move in

    // apply to local world, and send over WebRTC data channel

    //this._playerBody.rigidBody.applyImpulse(velocity)
  }
  playerRotate(quaternion) {  // sets player's rotation
    //this._playerBody.quaternion = quaternion
    //this._playerBody.quaternion = this._playerBody.quaternion.normalize()

  }

  // Chat
  sendChat(msg) {
    console.info(`[NetworkLink] Sending chat message: "${msg}"`)
    this.send(PacketEncoder.chat(this._username, msg))
  }

  // packet event handling
  on(event, callback) {
    this._callbacks[event] = callback
  }
  emit(event, data) {
    const callback = this._callbacks[event]
    if (typeof callback === "function") {
      callback(data)
    }
  }

}  