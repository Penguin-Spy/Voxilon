import GUI from '/client/GUI.js'
import World from '/common/World.js'
import PeerConnection from '/link/PeerConnection.js'
import PacketEncoder from '/link/PacketEncoder.js'
import PacketDecoder from '/link/PacketDecoder.js'
import Link from '/link/Link.js'
import { SIGNAL_ENDPOINT, PacketType } from '/link/Constants.js'
import Client from '/client/Client.js'
const { CHAT, SYNC_BODY } = PacketType

export default class DirectLink extends Link {
  /**
   * @param {Client} client
   */
  constructor(client, worldOptions) {
    super()
    this.username = "host" // maybe load from LocalStorage?

    // networking stuff
    this._clients = []

    // create/load world
    /** @type {World} */
    let world
    if(worldOptions.type === "load") {
      world = new World(worldOptions.data)
    } else if(worldOptions.type === "new") {
      world = new World({
        VERSION: "alpha_1",
        name: worldOptions.name,
        spawn_point: [0, 44, 0],
        bodies: [
          {
            type: "voxilon:celestial_body",
            radius: 40,
            surfaceGravity: 9.8,
            contraptions: []
          }, {
            type: "voxilon:celestial_body",
            position: [20, 60, 10],
            radius: 10,
            surfaceGravity: 9.8,
            contraptions: []
          }, {
            type: "voxilon:test_body",
            position: [2, 44, -7],
            is_static: false, is_box: false
          }, {
            type: "voxilon:test_body",
            position: [-2, 44, -7],
            is_static: true, is_box: false
          }
        ]
      })
    } else {
      throw new TypeError(`Unknown world type ${worldOptions.type}`)
    }

    // read-only properties
    Object.defineProperties(this, {
      world: { enumerable: true, value: world }
    })

    // initalize client
    this.client = client
    client.attach(this)

    client.setController("player", world.getPlayersCharacterBody(client.uuid))

    // create Integrated server
  }

  /* --- Direct Link methods --- */

  async publish(uri) {
    try {
      console.info("Publishing session to signaling server")

      if(!uri) { uri = SIGNAL_ENDPOINT + "/new_session" }

      // create session & start listening for WebRTC connections
      this.ws = new WebSocket(uri)
      this.ws.onmessage = e => {
        const data = JSON.parse(e.data)
        console.log("[link Receive]", data)
        switch(data.type) {
          case "hello": // from the signaling server
            console.info(`Join code: ${data.join_code}`)
            break;
          case "join": // request to join
            if(typeof data.username !== "string" || typeof data.uuid !== "string") {
              throw new TypeError("invalid join message")
            }
            console.info(`Approving ${data.username}'s request to join (${data.uuid})`)
            this.ws.send(JSON.stringify({
              to: data.from,
              type: "join",
              approved: true // always approve the request for now
            }))

            const client = this._clients[data.from] = {}
            client.id = data.from
            client.uuid = data.uuid

            // replaces the websocket onmessage handler with the peer connection one for establishing WebRTC
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

              // get or create client's player body (do this first so it gets serialized)
              client.body = this.world.getPlayersCharacterBody(client.uuid)

              // send world data
              const world_data = this.world.serialize()
              client.dataChannel.send(PacketEncoder.LOAD_WORLD(world_data))

              // tell the client to load in as their player
              console.log("setting client", client, "controller to player with netid", client.body.netID)
              client.dataChannel.send(PacketEncoder.SET_CONTROLLER_STATE("player", client.body.netID))
            }

            break;
          default:
            break;
        }
      }

      this.ws.onclose = ({ code, reason }) => {
        console.warn(`Websocket closed | ${code}: ${reason}`)
      }

    } catch(err) {
      console.error("An error occured while publishing the universe:", err)
    }
  }

  _handlePacket(client, data) {
    const packet = PacketDecoder.decode(data)

    // handle receiving packets
    switch(packet.$) {
      case CHAT:
        this.emit('chat_message', packet)
        this.broadcast(PacketEncoder.CHAT(packet.author, packet.msg))
        break;
        case SYNC_BODY:
          // validate it is the clients own body      
          if(packet.i !== client.body.netID) {
            console.error(`client #${client.id} sent sync packet for incorrect body:`, packet)
            client.dataChannel.close()
            break
          }
          
          client.body.position.set(...packet.p)
          client.body.velocity.set(...packet.v)
          client.body.quaternion.set(...packet.q)
          client.body.angularVelocity.set(...packet.a)
        
        break;
      default:
        throw new TypeError(`Unknown packet type ${packet.$}`)
    }
  }

  send(id, packet) {
    this._clients[id].send(packet)
  }

  broadcast(packet) {
    for(const client of this._clients) {
      if(client.dataChannel.readyState === "open") {
        client.dataChannel.send(packet)
      }
    }
  }

  step(deltaTime) {
    // update the world (physics & gameplay)
    super.step(deltaTime)

    // then calculate the priority of objects
    // (TODO)
    this.client.activeController.body.netPriority++;
    
    // send sync packets
    const ourBody = this.client.activeController.body
    if(ourBody.netPriority > 60) {
      ourBody.netPriority = 0
      const ourBodySync = PacketEncoder.SYNC_BODY(this.client.activeController.body)
    
      this.broadcast(ourBodySync)
    }
  }
  
  stop() {
    this.ws.close(1000, "stopping client")
    for(const client of this._clients) {
      client.dataChannel.close()
    }
  }


  /* --- Link interface methods --- */

  /*playerMove(velocity) {  // vector of direction to move in
    this.playerBody.velocity.copy(velocity)
  }*/
  /*playerRotate(bodyQuaternion, lookQuaternion) {  // sets player's rotation
    this.playerBody.quaternion = bodyQuaternion
    this.playerBody.lookQuaternion = lookQuaternion
  }*/

  // Chat
  sendChat(msg) {
    console.info(`[DirectLink] Sending chat message: "${msg}"`)
    // broadcast chat msg packet to all clients
    this.broadcast(PacketEncoder.CHAT(this.username, msg))
    // send it to ourselves via the event handler
    this.emit('chat_message', { author: this.username, msg })
  }

  // --- Building ---

  // TODO: removing components?
  // TODO: figure out how to serialize these actions & send them to clients
  // TODO: implement these methods on NetworkLink (serializing the request)
  //  will probably require determining a consistent ID for contraptions & bodies (need this anyways for other sync packets)

  // debugging
  newTestBody(stuff) {
    this.world.loadBody({
      type: "voxilon:test_body",
      position: stuff.position.toArray(),
      quaternion: stuff.quaternion.toArray(),
      is_static: false, is_box: stuff.is_box
    })
  }

  /**
   * Request to create a new standalone contraption in the world
   * @param {THREE.Vector3}    position       the contraption position
   * @param {THREE.Quaternion} quaternion     the contraption's own rotation
   * @param {object}           firstComponent data for the first component of the contraption
   */
  newStandaloneContraption(position, quaternion, firstComponent) {
    this.world.loadBody({
      type: "voxilon:contraption_body",
      position: position.toArray(),
      quaternion: quaternion.toArray(),
      contraption: {
        components: [
          {
            ...firstComponent,
            position: [0, 0, 0], // make sure it's at the origin
            rotation: 0
          },
        ]
      }
    })
  }

  /**
   * Request to create a new anchored contraption (attached to a celestial body)
   *
   * @param {CelestialBody}    parent         the celestial body that this contraption is attached to
   * @param {THREE.Vector3}    positionOffset the contraption position relative to the celestial body
   * @param {THREE.Quaternion} quaternion     the contraption's own rotation
   * @param {object}           firstComponent data for the first component of the contraption
   */
  newAnchoredContraption(parent, positionOffset, quaternion, firstComponent) {
    parent.addContraption(
      { // contraption data
        components: [
          {
            ...firstComponent,
            position: [0, 0, 0], // make sure it's at the origin
            rotation: 0
          },
        ],
        positionOffset: positionOffset.toArray(), // position/rotation offset
        quaternion: quaternion.toArray(),
      }
    )
  }

  /**
   * Request to add a component to a contraption
   * @param {Contraption} contraption the contraption to add to
   * @param {object} component        data for the new component
   */
  editContraption(contraption, component) {
    contraption.loadComponent(component)
  }
}
