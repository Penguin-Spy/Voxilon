import GUI from '/client/GUI.js'
import World from '/common/World.js'
import PeerConnection from '/link/PeerConnection.js'
import PacketEncoder from '/link/PacketEncoder.js'
import PacketDecoder from '/link/PacketDecoder.js'
import PlayerController from '/client/PlayerController.js'
import { SIGNAL_ENDPOINT, PacketType } from '/link/Constants.js'
const { CHAT, ADD_BODY } = PacketType

const DT = 1/60

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
    this._world = new World({
      VERSION: "alpha-0",
      name: worldOptions.name,
      bodies: [
        {
          type: "voxilon:celestial_body",
          radius: 40,
          surfaceGravity: 9.8
        }, {
          type: "voxilon:celestial_body",
          position: [20, 60, 10],
          radius: 10,
          surfaceGravity: 9.8
        }, {
          type: "voxilon:test_body",
          position: [2, 44, -7],
          static: false
        }, {
          type: "voxilon:test_body",
          position: [-2, 44, -7],
          static: true
        }, {
          type: "voxilon:player_body",
          position: [0, 44, 0]
        }
      ]
    })

    // find player's body
    this._playerBody = this._world.getBodyByType("voxilon:player_body")

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
      this.ws = new WebSocket(SIGNAL_ENDPOINT + "/new_session")
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
            client.dataChannel.onclose = e => { console.info(`[dataChannel:${client.id}] close`) }
            client.dataChannel.onmessage = ({ data }) => {
              try {
                this._handlePacket(client, data)
              } catch(e) {
                console.error(data)
                GUI.showError("Error occured while handling packet", e)
              }
            }
            
            client.dataChannel.onopen = e => {
              console.info(`[dataChannel:${client.id}] open`)
              
              // send world data
              const world_data = this._world.serialize()
              client.dataChannel.send(PacketEncoder.LOAD_WORLD(world_data))
              
              // create client's player body
              client.body = this._world.loadBody({
                type: "voxilon:player_body",
                position: [0, 44, 0]
              })
              const packet = PacketEncoder.ADD_BODY(client.body.serialize(), false)
              const clientPacket = PacketEncoder.ADD_BODY(client.body.serialize(), true)
              for (const broadcastClient of this._clients) {
                if(broadcastClient === client) {
                  console.log(`sending clientPacket to ${client.id}`, clientPacket)
                  broadcastClient.dataChannel.send(clientPacket)
                } else {
                  console.log(`sending packet to ${client.id}`, packet)
                  broadcastClient.dataChannel.send(packet)
                }
              }
            }

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
    const packet = PacketDecoder.decode(data)

    // handle receiving packets
    switch (packet.$) {
      case CHAT:
        this.emit('chat_message', packet)
        this.broadcast(PacketEncoder.CHAT(packet.author, packet.msg))
        break;
      // ADD_BODY wouldn't be valid to send to the server
      // clients will use a different packet to request placing stuff
      /*case ADD_BODY:
        const body = this._world.loadBody(packet)
          // check if the loaded body was ours
        if(packet.type === "voxilon:player_body" && packet.is_client_body) {
          this._playerBody.attach(this.playerController)
        }
        break;*/
      default:
        throw new TypeError(`Unknown packet type ${packet.$}`)
    }
  }

  send(id, packet) {
    this._clients[id].send(packet)
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
  playerRotate(bodyQuaternion, lookQuaternion) {  // sets player's rotation
    this._playerBody.quaternion = bodyQuaternion
    this._playerBody.lookQuaternion = lookQuaternion
  }

  // Chat
  sendChat(msg) {
    console.info(`[DirectLink] Sending chat message: "${msg}"`)
    // broadcast chat msg packet to all clients
    this.broadcast(PacketEncoder.CHAT(this._username, msg))
    // send it to ourselves via the event handler
    this.emit('chat_message', { author: this._username, msg })
  }

  /* --- Identical between Direct & Network links ---- */
  // TODO: don't duplicate this code? have a parent class for both links? some other method?

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

    while (this.accumulator > DT && maxSteps > 0) {
      this._world.step(DT)
      this.accumulator -= DT
      maxSteps--
    }

    if(this.accumulator > DT) {  // remove extra steps worth of time that could not be processed
      console.warn(`Warning: stepping world took too many steps to catch up! Simulation is behind by ${Math.floor(this.accumulator / DT)}ms`)
      this.accumulator = this.accumulator % DT
    }
    
  }
}  