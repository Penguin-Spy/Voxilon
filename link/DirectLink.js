import GUI from 'client/GUI.js'
import ServerWorld from 'engine/ServerWorld.js'
import { default as PacketEncoder, PacketType } from 'link/PacketEncoder.js'
import PacketDecoder from 'link/PacketDecoder.js'
import Link from 'link/Link.js'
import Client from 'client/Client.js'
import LocalPlayer from 'link/LocalPlayer.js'
import RemotePlayer from 'link/RemotePlayer.js'
import { sessionPublishURL } from 'link/util.js'
const { CHAT, SYNC_BODY } = PacketType

export default class DirectLink extends Link {
  /** @type {World} */
  world

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
      world = new ServerWorld(worldOptions.data, this)
    } else if(worldOptions.type === "new") {
      world = new ServerWorld({
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
      }, this)
    } else {
      throw new TypeError(`Unknown world type ${worldOptions.type}`)
    }

    // read-only properties
    Object.defineProperties(this, {
      world: { enumerable: true, value: world }
    })

    // initalize client
    this.localPlayer = new LocalPlayer(this, client)
    client.attach(this)
    
    this.localPlayer.setController("player", world.joinPlayer(this.localPlayer))
    
    // create Integrated server
  }

  /* --- Direct Link methods --- */

  async publish() {
    try {
      console.info("Publishing session to signaling server")

      // create session & start listening for WebRTC connections
      this.ws = new WebSocket(sessionPublishURL)
      this.ws.addEventListener("message", async e => {
        const data = JSON.parse(e.data)
        console.log("[link signal receive]", data)
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

            const player = this._clients[data.from] = new RemotePlayer(this, data.username, data.uuid, data.from);
            
            await player.ready
            
            // send world data
            const world_data = this.world.serialize()
            player.sendSyncPacket(PacketEncoder.LOAD_WORLD(world_data))
            
            // add the player to the world. may load a new character body if necessary. always returns the player's body
            const playerBody = this.world.joinPlayer(player)

            // tell the client to load in as their player
            console.log("setting player", player, "controller to player with netid", playerBody)
            player.setController("player", playerBody)

            break;
          default:
            break;
        }
      })

      this.ws.addEventListener("close", ({ code, reason }) => {
        console.warn(`Websocket closed | ${code}: ${reason}`)
      })

    } catch(err) {
      console.error("An error occured while publishing the universe:", err)
    }
  }

  handlePacket(client, data) {
    try {
      const packet = PacketDecoder.decode(data)

      // handle receiving packets
      switch(packet.$) {
        case CHAT:
          this.emit('chat_message', packet)
          this.broadcast(PacketEncoder.CHAT(packet.author, packet.msg))
          break;
        case SYNC_BODY:
          // validate it is the clients own body
          if(packet.i !== client.body.id) {
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
    } catch(e) {
      console.error("client:", client, "packet data:", data)
      GUI.showError("Error occured while handling packet", e)
    }
  }

  send(id, packet) {
    throw new Error("link#send called?", id, packet)
  }

  broadcast(packet) {
    for(const client of this._clients) {
      if(client.dataChannel.readyState === "open") {
        client.dataChannel.send(packet)
      }
    }
  }
  
  sendLoadBody(body) {
    this.broadcast(PacketEncoder.LOAD_BODY(body))
  }

  // ran after each DT world step
  postUpdate() {
    const body = this.world.netSyncQueue.next()
    if(!body) return
    const bodySync = PacketEncoder.SYNC_BODY(body)

    for(const client of this._clients) {
      if(client.dataChannel.readyState === "open" &&
        client.body !== body) { // do not send a client a sync packet for their own body, they have the authoritative state of it
        client.dataChannel.send(bodySync)
      }
    }
  }

  stop() {
    if(this.ws) {
      this.ws.close(1000, "stopping client")
      for(const client of this._clients) {
        client.dataChannel.close()
      }
    }
  }


  /* --- Link interface methods --- */

  /** Send a chat message as this player.
   * @param {string} msg  the message to send. uses the Link's username.  */
  sendChat(msg) {
    console.info(`[DirectLink] Sending chat message: "${msg}"`)
    // broadcast chat msg packet to all clients
    this.broadcast(PacketEncoder.CHAT(this.username, msg))
    // send it to ourselves via the event handler
    this.emit('chat_message', { author: this.username, msg })
  }
  
  /** Informs the server that the player interacted with a component.
   * @param {Component} component The component that was interacted with
   * @param {boolean} alternate   True if the 'alternate' interaction action should be taken (e.g. open gui instead of activating component)
   */
  interact(component, alternate) {
    component.interact(this.localPlayer, alternate)
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
