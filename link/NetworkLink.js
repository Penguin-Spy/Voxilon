import World from '../common/World.js'
import PlayerBody from '/common/bodies/Player.js'
import DataConnection from '/link/DataConnection.js'

export default class NetworkLink {
  constructor(code, username) {
    this.username = username

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
      console.info("[link Receive]", data)
      switch (data.type) {
        case "join":
          if (data.approved) { // request to join was approved, continue with WebRTC
            this.pc = new RTCPeerConnection()
            this.dataConnection = new DataConnection(this.pc, this.ws)

            this.pc.ondatachannel = ({ channel }) => {
              this.dataChannel = channel
              this.dataChannel.onmessage = ({ data }) => {
                console.log(`[dataChannel] ${data}`)
              }
            }

            /*this.dataChannel = this.pc.createDataChannel("link", { ordered: false })

            this.dataChannel.onmessage = ({ data }) => {
              console.log(`[dataChannel:${client.id}] ${data}`)
            }*/
          } else { // it was denied, close websocket
            this.ws.close(1000, "Join request not approved")
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

    /*pc.ondatachannel = ({ channel }) => {
      console.log("received data channel:", channel)
      channel.onmessage = e => {
        console.info(e.data)
      }
      channel.onopen = e => console.log("sendChannel.onopen: ", e)
      channel.onclose = e => console.log("sendChannel.onclose: ", e)
    }*/
  }

  get playerBody() { return this._playerBody }
  //get world() { console.error("accessing Link.world directly!!") }
  get world() { return this._world }

  /* --- Link interface methods --- */

  playerMove(velocity) {  // vector of direction to move in

    // apply to local world, and send over WebRTC data channel

    //this._playerBody.rigidBody.applyImpulse(velocity)
  }
  playerRotate(quaternion) {  // sets player's rotation
    //this._playerBody.quaternion = quaternion
    //this._playerBody.quaternion = this._playerBody.quaternion.normalize()

  }

  /* Chat */
  sendChat(message) { }

}  