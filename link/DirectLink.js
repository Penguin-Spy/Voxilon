import World from '/common/World.js'
import PlayerBody from '/common/bodies/PlayerBody.js'
import PeerConnection from '/link/PeerConnection.js'
import PacketEncoder from '/link/PacketEncoder.js'
import PacketDecoder from '/link/PacketDecoder.js'
import PlayerController from '/client/PlayerController.js'

const dt = 1/60

export default class DirectLink {
  constructor(worldOptions) {
    /* 
    worldOptions = {
      type: 'file',
      file: [object File]
    }
    */

    this.accumulator = 0

    // networking stuff
    this._clients = []
    this._callbacks = {}
    this._username = "host" // maybe load from LocalStorage?

    // create/load world
    this._world = new World()

    // create player's body
    this._playerBody = new PlayerBody()
    this._playerBody.position = { x: 0, y: 24, z: 0 }
    this._world.addBody(this._playerBody)

    this.playerController = new PlayerController();
    this._playerBody.attach(this.playerController)

    // create Integrated server
  }

  get playerBody() { return this._playerBody }
  //get world() { console.error("accessing Link.world directly!!") }
  get world() { return this._world }
  get username() { return this._username }

  /* --- Direct Link methods --- */

  async publish(options) {
    try {
      options.name = options.name ?? "A Universe";
      console.info("Publishing w/ options:", options)

      // get game code from signaling server
      this._username = options.username ?? this._username;

      // start listening for WebRTC connections
      this.ws = new WebSocket(`wss://signal.voxilon.ml/new_session`)
      this.ws.onmessage = e => {
        const data = JSON.parse(e.data)
        console.log("[link Receive]", data)
        switch (data.type) {
          case "hello":
            console.info(`Join code: ${data.join_code}`)
            break;
          case "join": // request to join
            console.info(`Approving ${data.username}'s request to join`)
            this.ws.send(JSON.stringify({
              to: data.from,
              type: "join",
              approved: true // always approve the request for now
            }))

            const client = this._clients[data.from] = {}
            client.id = data.from

            client.pc = new PeerConnection(this.ws, client.id)

            client.dataChannel = client.pc.createDataChannel("link", {
              ordered: false,
              negotiated: true, id: 0
            })
            client.dataChannel.onopen = e => { console.info(`[dataChannel:${client.id}] open`) }
            client.dataChannel.onclose = e => { console.info(`[dataChannel:${client.id}] close`) }
            client.dataChannel.onmessage = ({ data }) => { this._handlePacket(client, data) }

            break;
          default:
            break;
        }
      }

      this.ws.onclose = ({ code, reason }) => {
        console.warn(`Websocket closed | ${code}: ${reason}`)
      }

    } catch (err) {
      console.error("An error occured while publishing the universe:", err)
    }
  }

  _handlePacket(client, data) {
    console.log(`[dataChannel:${client.id}] ${data}`)
    const packet = PacketDecoder.chat(data)
    // temp just treat everything as chat msg
    this.emit('chat_message', packet)
    this.broadcast(PacketEncoder.chat(packet.author, packet.msg))
  }


  broadcast(packet) {
    for (const client of this._clients) {
      client.dataChannel.send(packet)
    }
  }


  /* --- Link interface methods --- */

  playerMove(velocity) {  // vector of direction to move in
    this._playerBody.rigidBody.applyImpulse(velocity)
  }
  /*playerLook(lookQuaternion) {
    this._playerBody.lookQuaternion = lookQuaternion
  }*/
  playerRotate(bodyQuaternion, lookQuaternion) {  // sets player's rotation
    this._playerBody.quaternion = bodyQuaternion
    this._playerBody.lookQuaternion = lookQuaternion
  }

  // Chat
  sendChat(msg) {
    console.info(`[DirectLink] Sending chat message: "${msg}"`)
    // broadcast chat msg packet to all clients
    this.broadcast(PacketEncoder.chat(this._username, msg))
    // send it to ourselves via the event handler
    this.emit('chat_message', { author: this._username, msg })
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

  step(deltaTime) {
    this.accumulator += deltaTime
    let maxSteps = 10;

    while (this.accumulator > dt && maxSteps > 0) {
      this._world.step(dt)
      this.accumulator -= dt
      maxSteps--
    }

    if(this.accumulator > dt) {  // remove extra steps worth of time that could not be processed
      console.warn(`Warning: stepping world took too many steps to catch up! Simulation is behind by ${Math.floor(this.accumulator / dt)}ms`)
      this.accumulator = this.accumulator % dt
    }
    
  }
}  