/** @typedef {import('engine/World.js').default} World */
/** @typedef {import('link/Player.js').default} Player */

import { Vector3 } from 'three'
import { Vec3, Box } from 'cannon-es'
import { check } from 'engine/util.js'
import NetworkedComponent from 'engine/NetworkedComponent.js'
import { boundingBoxFromDimensions, generatePreviewMesh } from 'engine/components/componentUtil.js'
import { loadGLTF } from 'engine/ModelLoader.js'
import ThrustManager from 'engine/ThrustManager.js'
import GyroManager from 'engine/GyroManager.js'
import PacketEncoder from 'link/PacketEncoder.js'

const mesh = await loadGLTF("/assets/components/control_seat.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:control_seat"

export default class ControlSeat extends NetworkedComponent {
  #seatedCharacterID

  /**
   * @param {Object} data
   * @param {World} world
   */
  constructor(data, world) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, world, boxShape, mesh.clone())
    this.lookPositionOffset = new Vector3(0, 0.3, 0)

    this.thrustManager = new ThrustManager(this)
    this.gyroManager = new GyroManager(this)

    this.seatedCharacter = null
    this.#seatedCharacterID = data.seatedCharacterID ?? false
  }
  reviveReferences() {
    if(this.#seatedCharacterID) {
      this.seatedCharacter = this.world.getBodyByID(this.#seatedCharacterID)
      this.#seatedCharacterID = false
    }
  }

  serialize() {
    const data = super.serialize()
    if(this.seatedCharacter) {
      data.seatedCharacterID = this.seatedCharacter.id
    }
    return data
  }

  serializeNetwork() {
    return {
      thrustManager: this.thrustManager.serializeNetwork(),
      gyroManager: this.gyroManager.serializeNetwork()
    }
  }
  reviveNetwork(netData) {
    this.thrustManager.reviveNetwork(netData.thrustManager ?? {})
    this.gyroManager.reviveNetwork(netData.gyroManager ?? {})
  }

  setParent(contraption) {
    super.setParent(contraption)
    const body = contraption.getBody()
    this.thrustManager.setBody(body)
    this.gyroManager.setBody(body)
    contraption.managers.push(this.thrustManager)
    contraption.managers.push(this.gyroManager)
  }

  getThrustManager() {
    return this.thrustManager
  }
  getGyroManager() {
    return this.gyroManager
  }

  // well now this is extra dumb
  // TODO: don't even sync the network/internal state of components to the client, they don't need to know any of it
  receiveSelfSync(packet) {
    switch(packet.action) {
      case "add_thruster":
        for(const hostname of packet.data) {
          this.thrustManager.addThruster(this.network.getComponent(hostname))
        }
        break
      case "remove_thruster":
        for(const hostname of packet.data) {
          this.thrustManager.removeThruster(hostname)
        }
        break
      case "add_gyroscope":
        for(const hostname of packet.data) {
          this.gyroManager.addGyroscope(this.network.getComponent(hostname))
        }
        break
      case "remove_gyroscope":
        for(const hostname of packet.data) {
          this.gyroManager.removeGyroscope(hostname)
        }
        break
      default:
        throw new Error(`unknown sync action on ControlSeat '${packet.action}'`)
    }
  }

  /** Receives a screen action triggered by a player
   * @param {Player} player The player who performed the action
   * @param {string} action The action
   * @param {object} data Data for the action
  */
  receiveScreenAction(player, action, data) {
    switch(action) {
      case "add_thruster":
        for(const hostname of data) {
          this.thrustManager.addThruster(this.network.getComponent(hostname))
        }
        break
      case "remove_thruster":
        for(const hostname of data) {
          this.thrustManager.removeThruster(hostname)
        }
        break
      case "add_gyroscope":
        for(const hostname of data) {
          this.gyroManager.addGyroscope(this.network.getComponent(hostname))
        }
        break
      case "remove_gyroscope":
        for(const hostname of data) {
          this.gyroManager.removeGyroscope(hostname)
        }
        break
      default:
        throw new Error(`unknown action on ControlSeat '${action}'`)
    }
    // send self sync packet to all clients
    this.sendSelfSync(PacketEncoder.SYNC_CONTROL_SEAT_STATE(this.id, action, data))
    // send update screen packet to player
    player.sendScreenUpdate("refresh")
  }

  /** Processes the player interacting with the seat.
   * @param {Player} player     The player who interacted with the seat
   * @param {boolean} alternate The main action is to sit in the seat, the alternate is to open the configuration gui
   */
  interact(player, alternate) {
    if(!alternate) {
      console.log("sit", player, this)
      if(!this.seatedCharacter) { // if the seat is unoccupied, the player may sit
        this.sit(player)
      } else {
        const character = player.character
        if(this.seatedCharacter === character) { // if the player is already in this seat, stop sitting
          this.stopSitting(player)
        } else { // seat is occupied by a different character, cannot sit
          console.warn("cannot sit in occupied seat")
        }
      }
    } else {
      console.log("gui", player, this)
      player.setScreen("control_seat", this)
    }
  }

  /** Makes the given player sit in this seat
   * @param {Player} player */
  sit(player) {
    const character = player.character
    if(character === null) {
      console.warn("player", player, "does not have a character, cannot sit on", this)
      return
    }
    // make player's character body sit in this seat
    character.sitOn(this)
    this.seatedCharacter = character

    // set player's controller to ContraptionController with this seat as the seat
    player.setController("contraption", this)
  }

  /** Makes the given player dismount this seat */
  stopSitting(player) {
    const character = this.seatedCharacter
    character.stopSitting(this)
    this.seatedCharacter = null
    // TODO: set the body's position, velocity, rotation, and angular velocity to match this component's values (offset position up 1 meter)

    player.setController("player", character)
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "control_seat"
}
