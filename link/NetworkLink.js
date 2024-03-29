import GUI from '/client/GUI.js'
import World from '/common/World.js'
import PeerConnection from '/link/PeerConnection.js'
import PacketEncoder from '/link/PacketEncoder.js'
import PacketDecoder from '/link/PacketDecoder.js'
import Link from '/link/Link.js'
import PlayerController from '/client/PlayerController.js'
import { SIGNAL_ENDPOINT, PacketType } from '/link/Constants.js'
const { CHAT, LOAD_WORLD, ADD_BODY } = PacketType

const JOIN_CODE_REGEX = /^([A-HJ-NP-Z0-9]{5})$/

// CONNECTING: waiting for WebSocket connect, join request, and WebRTC connect
// LOADING: WebRTC connected, waiting for world to load
// LOADED: world loaded
// ATTACHED: attached to client player body
const CONNECTING = 0, LOADING = 1, LOADED = 2, ATTACHED = 3

export default class NetworkLink extends Link {
  constructor(hud, renderer, target, username) {
    super(hud, renderer, username) // maybe load from LocalStorage? (prefill input of gui)

    this._readyState = CONNECTING

    this._readyPromise = new Promise((resolve, reject) => {
      this._readyResolve = resolve
      this._readyReject = reject
    })

    // open a WebRTC data channel with the host of the specified game
    if(target.match(JOIN_CODE_REGEX)) { // convert join code to full url
      console.log(`prefixing ${target}`)
      target = `${SIGNAL_ENDPOINT}/${target}`
    }
    // normalize url (URL constructor is allowed to throw an error)
    const targetURL = new URL(target)
    targetURL.protocol = "wss:"
    targetURL.hash = ""
    console.log(targetURL)

    // create websocket & add msg handler
    this.ws = new WebSocket(targetURL)

    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      console.log("[link Receive]", data)
      switch(data.type) {
        case "join":
          if(data.approved) { // request to join was approved, continue with WebRTC
            this.pc = new PeerConnection(this.ws)

            this.dataChannel = this.pc.createDataChannel("link", {
              ordered: false,
              negotiated: true, id: 0
            })
            this.dataChannel.onclose = e => { console.info("[dataChannel] close") }
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
      if(this._readyState === CONNECTING) {
        this._readyReject(new Error("Websocket closed while connecting"))
      }
    }
  }

  get ready() { return this._readyPromise }

  get playerBody() { return this._playerBody }
  get world() { return this._world }

  /* --- Network Link methods --- */
  _handlePacket(data) {
    console.log(`[dataChannel] ${data}`)
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

      case ADD_BODY:
        const body = this._world.loadBody(packet.data)
        // check if the loaded body was ours
        if(packet.data.type === "voxilon:character_body" && packet.is_client_body) {
          console.log("loaded our body:", packet)
          this.setActiveController("player", { playerBody: body })
          /*this._playerBody = body
          this._playerBody.attach(this.playerController)*/
          this._readyState = ATTACHED
          this._readyResolve()
        }
        break;
      default:
        throw new TypeError(`Unknown packet type ${packet.$}`)
    }
  }

  send(packet) {
    this.dataChannel.send(packet)
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
    this.send(PacketEncoder.CHAT(this._username, msg))
  }
}
