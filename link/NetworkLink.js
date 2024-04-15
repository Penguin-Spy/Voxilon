import GUI from 'client/GUI.js'
import World from 'engine/World.js'
import PeerConnection from 'link/PeerConnection.js'
import PacketEncoder from 'link/PacketEncoder.js'
import PacketDecoder from 'link/PacketDecoder.js'
import Link from 'link/Link.js'
import PlayerController from 'client/PlayerController.js'
import { PacketType } from 'link/Constants.js'
import { parseSignalTarget } from 'link/util.js'
const { CHAT, LOAD_WORLD, SET_CONTROLLER_STATE, SYNC_BODY } = PacketType


// CONNECTING: waiting for WebSocket connect, join request, and WebRTC connect
// LOADING: WebRTC connected, waiting for world to load
// LOADED: world loaded
// ATTACHED: attached to client player body
const CONNECTING = 0, LOADING = 1, LOADED = 2, ATTACHED = 3

export default class NetworkLink extends Link {
  constructor(client, target, username) {
    super()
    this.username = username
    this.bodyNetPriority = 0

    this._readyState = CONNECTING

    this._readyPromise = new Promise((resolve, reject) => {
      this._readyResolve = resolve
      this._readyReject = reject
    })

    // create websocket & add msg handler
    const targetURL = parseSignalTarget(target)
    console.info("Connecting to ", targetURL.href)
    this.ws = new WebSocket(targetURL)

    this.ws.addEventListener("message", e => {
      const data = JSON.parse(e.data)
      console.log("[link signal receive]", data)
      switch(data.type) {
        case "join":
          if(data.approved) { // request to join was approved, continue with WebRTC
            this.pc = new PeerConnection(this.ws)

            this.dataChannel = this.pc.createDataChannel("link", {
              ordered: false,
              negotiated: true, id: 0
            })
            this.dataChannel.onclose = e => {
              console.info("[dataChannel] close:", e)
              // need to stop the client and display a message when the connection is closed by the host, but not overwrite the shown error if we close our own data channel
              //GUI.showError("connection to host closed", {})
            }
            this.dataChannel.onmessage = ({ data }) => {
              try {
                this._handlePacket(data)
              } catch(e) {
                console.error(data)
                GUI.showError("Error occured while handling packet", e)
              }
            }
            this.dataChannel.onopen = e => {
              console.info("[dataChannel] open")
              this._readyState = LOADING
            }

          } else { // it was denied, close websocket
            this.ws.close(1000, "Join request not approved")
            console.info("Join request not approved")
          }
          break;
        default:
          break;
      }
    })

    this.client = client

    // finally, request to join
    this.ws.addEventListener("open", () => {
      this.ws.send(JSON.stringify({
        type: "join",
        username: this.username,
        uuid: this.client.uuid
      }))
    })
    this.ws.addEventListener("close", ({ code, reason }) => {
      console.warn(`Websocket closed | ${code}: ${reason}`)
      if(this._readyState === CONNECTING) {
        this._readyReject(new Error("Websocket closed while connecting"))
      }
    })
  }

  get ready() { return this._readyPromise }

  get playerBody() { return this._playerBody }
  get world() { return this._world }

  /* --- Network Link methods --- */
  _handlePacket(data) {
    const packet = PacketDecoder.decode(data)

    // handle receiving packets
    switch(packet.$) {
      case CHAT:
        this.emit('chat_message', packet)
        break;

      case LOAD_WORLD:
        this._world = new World(packet.world_data)
        this._readyState = LOADED
        console.log("loaded world")
        break;

      case SET_CONTROLLER_STATE:
        // initalize the client if this was the first set controller state packet of the session
        if(this._readyState === LOADED) {
          this._readyState = ATTACHED
          this._readyResolve()
          this.client.attach(this)
        }

        const body = this.world.getBodyByNetID(packet.netID)
        this.client.setController(packet.type, body)

        break;

      case SYNC_BODY:
        const syncedBody = this.world.getBodyByNetID(packet.i)

        syncedBody.position.set(...packet.p)
        syncedBody.velocity.set(...packet.v)
        syncedBody.quaternion.set(...packet.q)
        syncedBody.angularVelocity.set(...packet.a)

        break;

      default:
        throw new TypeError(`Unknown packet type ${packet.$}`)
    }
  }

  send(packet) {
    this.dataChannel.send(packet)
  }

  step(deltaTime) {
    // update the world (physics & gameplay)
    super.step(deltaTime)

    // then calculate the priority of syncing our own body
    this.bodyNetPriority++
    if(this.bodyNetPriority > 30) {
      this.bodyNetPriority = 0
      this.dataChannel.send(PacketEncoder.SYNC_BODY(this.client.activeController.body))
    }
  }

  stop() {
    try {
      this.ws.close(1000, "stopping client")
    } catch(e) {
      console.error("error occured while stopping & closing websocket:", e)
    }
    try {
      this.dataChannel.close()
    } catch(e) {
      console.error("error occured while stopping & closing data channel:", e)
    }
  }

  /* --- Link interface methods --- */
  // apply to local world, and send over WebRTC data channel

  playerMove(velocity) {  // vector of direction to move in
    this._playerBody.velocity.copy(velocity)
  }
  playerRotate(bodyQuaternion, lookQuaternion) {  // sets player's rotation
    this._playerBody.quaternion = bodyQuaternion
    this._playerBody.lookQuaternion = lookQuaternion
  }


  // Chat
  sendChat(msg) {
    console.info(`[NetworkLink] Sending chat message: "${msg}"`)
    this.send(PacketEncoder.CHAT(this.username, msg))
  }
}
