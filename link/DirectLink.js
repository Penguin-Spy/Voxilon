import World from '/common/World.js'
import PlayerBody from '/common/bodies/Player.js'
import DataConnection from '/link/DataConnection.js'

export default class DirectLink {
  constructor(worldOptions) {
    /* 
    worldOptions = {
      type: 'file',
      file: [object File]
    }
    */

    this._clients = []

    // create/load world
    this._world = new World()

    // create player's body
    this._playerBody = new PlayerBody()
    this._playerBody.position = { x: 0, y: 1, z: 0 }
    this._world.addBody(this._playerBody)

    // create Integrated server
  }

  get playerBody() { return this._playerBody }
  //get world() { console.error("accessing Link.world directly!!") }
  get world() { return this._world }

  /* --- Direct Link methods --- */

  publish(code) {
    // get game code from signaling server
    // start listening for WebRTC connections
    this.ws = new WebSocket(`wss://${window.location.hostname}/signal?code=${code}`)
    this.ws.onmessage = e => {
      const data = JSON.parse(e.data)
      console.log("[link Receive]", data)
      switch (data.type) {
        case "join": // request to join
          console.log(`Approving ${data.username}'s request to join`)
          this.ws.send(JSON.stringify({
            to: data.from,
            type: "join",
            approved: true // always approve the request for now
          }))

          const client = this._clients[data.from] = {}
          client.id = data.from

          client.pc = new RTCPeerConnection()
          client.dataConnection = new DataConnection(client.pc, this.ws, client.id)

          client.dataChannel = client.pc.createDataChannel("link", { ordered: false })

          client.dataChannel.onmessage = ({ data }) => {
            console.log(`[dataChannel:${client.id}] ${data}`)
          }

          break;
        default:
          break;
      }
    }

    this.ws.onclose = ({ code, reason }) => {
      console.warn(`Websocket closed | ${code}: ${reason}`)
    }

    //sendChannel = localConnection.createDataChannel("sendChannel")
  }


  /* --- Link interface methods --- */

  playerMove(velocity) {  // vector of direction to move in
    this._playerBody.rigidBody.applyImpulse(velocity)
  }
  playerRotate(quaternion) {  // sets player's rotation
    this._playerBody.quaternion = quaternion
    this._playerBody.quaternion = this._playerBody.quaternion.normalize()
  }

  /* Chat */
  sendChat(message) { }

}  