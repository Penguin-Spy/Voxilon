import GUI from '/client/GUI.js'
import World from '/common/World.js'
import PeerConnection from '/link/PeerConnection.js'
import PacketEncoder from '/link/PacketEncoder.js'
import PacketDecoder from '/link/PacketDecoder.js'
import Link from '/link/Link.js'
import PlayerController from '/client/PlayerController.js'
import { SIGNAL_ENDPOINT, PacketType } from '/link/Constants.js'
const { CHAT, ADD_BODY } = PacketType

export default class DirectLink extends Link {
  constructor(worldOptions) {
    super("host") // maybe load from LocalStorage?

    // networking stuff
    this._clients = []

    // create/load world
    let world
    if(worldOptions.type === "load") {
      world = new World(worldOptions.data)
    } else if(worldOptions.type === "new") {
      world = new World({
        VERSION: "alpha-0",
        name: worldOptions.name,
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
          }, {
            type: "voxilon:player_body",
            position: [0, 44, 0]
          }
        ]
      })
    } else {
      throw new TypeError(`Unknown world type ${worldOptions.type}`)
    }


    // find player's body
    const playerBody = world.getBodyByType("voxilon:player_body")

    const playerController = new PlayerController();
    playerBody.attach(playerController)

    // read-only properties
    Object.defineProperties(this, {
      world: { enumerable: true, value: world },
      playerBody: { enumerable: true, value: playerBody },
      playerController: { enumerable: true, value: playerController },
    })

    // create Integrated server
  }


  /* --- Direct Link methods --- */

  async publish() {
    try {
      console.info("Publishing session to signaling server")

      // create session & start listening for WebRTC connections
      this.ws = new WebSocket(SIGNAL_ENDPOINT + "/new_session")
      this.ws.onmessage = e => {
        const data = JSON.parse(e.data)
        console.log("[link Receive]", data)
        switch(data.type) {
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
              const world_data = this.world.serialize()
              client.dataChannel.send(PacketEncoder.LOAD_WORLD(world_data))

              // create client's player body
              client.body = this.world.loadBody({
                type: "voxilon:player_body",
                position: [0, 44, 0]
              })
              const packet = PacketEncoder.ADD_BODY(client.body.serialize(), false)
              const clientPacket = PacketEncoder.ADD_BODY(client.body.serialize(), true)
              for(const broadcastClient of this._clients) {
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

    } catch(err) {
      console.error("An error occured while publishing the universe:", err)
    }
  }

  _handlePacket(client, data) {
    console.log(`[dataChannel:${client.id}] ${data}`)
    const packet = PacketDecoder.decode(data)

    // handle receiving packets
    switch(packet.$) {
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
    for(const client of this._clients) {
      client.dataChannel.send(packet)
    }
  }


  /* --- Link interface methods --- */

  playerMove(velocity) {  // vector of direction to move in
    this.playerBody.velocity.copy(velocity)
  }
  playerRotate(bodyQuaternion, lookQuaternion) {  // sets player's rotation
    this.playerBody.quaternion = bodyQuaternion
    this.playerBody.lookQuaternion = lookQuaternion
  }

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
   * Request to create a new contraption in the world
   *
   * @param {THREE.Vector3}    position       the placement position
   * @param {THREE.Quaternion} quaternion     the placement rotation
   * @param {object}           firstComponent data for the first component of the contraption
   * @param {CelestialBody?}   parent         The celestial body that this contraption is attached to, or `undefined` if the contraption will be free-floating. \
   *                                            If this is specified, `position` and `quaternion` become relative to the celestial body.
   */
  newContraption(position, quaternion, firstComponent, parent) {
    if(!parent) {
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
    } else {
      parent.addContraption(
        { // contraption data
          components: [
            {
              ...firstComponent,
              position: [0, 0, 0], // make sure it's at the origin
              rotation: 0
            },
          ],
          positionOffset: position.toArray(), // position/rotation offset
          quaternionOffset: quaternion.toArray(),
        }
      )
    }
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
