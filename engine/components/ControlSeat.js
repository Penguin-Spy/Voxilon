import World from 'engine/World.js'

import { Vector3 } from 'three'
import { Vec3, Box } from 'cannon'
import { check } from 'engine/util.js'
import NetworkedComponent from 'engine/NetworkedComponent.js'
import { boundingBoxFromDimensions, generatePreviewMesh } from 'engine/components/componentUtil.js'
import { loadGLTF } from 'engine/ModelLoader.js'
import ThrustManager from 'engine/ThrustManager.js'
import GyroManager from 'engine/GyroManager.js'

const mesh = await loadGLTF("/assets/components/control_seat.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:control_seat"

export default class ControlSeat extends NetworkedComponent {

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

    const characterBodyData = check(data.storedCharacterBody, "object?")
    if(characterBodyData) {
      this.storedCharacterBody = world.loadBody(characterBodyData, false)
    } else {
      this.storedCharacterBody = null
    }
    
    this.seatedPlayer = null
  }

  serialize() {
    const data = super.serialize()
    if(this.storedCharacterBody) {
      data.storedCharacterBody = this.storedCharacterBody.serialize()
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
  
  /** Processes the player interacting with the seat.
   * @param {Player} player     The player who interacted with the seat
   * @param {boolean} alternate The main action is to sit in the seat, the alternate is to open the configuration gui
   */
  interact(player, alternate) {
    if(!alternate) {
      console.log("sit", player, this)
      if(this.seatedPlayer === player) {
        this.stopSitting(player)
      } else {
        this.sit(player) // will kick out the player currently in the seat if there is one
      }
    } else {
      console.log("gui", player, this)
    }
  }
  
  /** Makes the given player sit in this seat */
  sit(player) {
    // kick out any player that's already in the seat
    if(this.seatedPlayer) {
      this.stopSitting(this.seatedPlayer)
    }
    
    const character = player.getCharacter()
    if(character === null) {
      console.warn("player", player, "does not have a character, cannot sit on", this)
      return
    }
    // make player's character body sit in this seat
    this.storedCharacterBody = character
    this.world.removeBody(character)
    
    // set player's controller to ContraptionController with this seat as the seat
    player.setController("contraption", this)
    this.seatedPlayer = player
  }
  
  /** Makes the given player dismount this seat */
  stopSitting(player) {
    const character = this.storedCharacterBody
    this.storedCharacterBody = null
    this.world.addBody(character)
    // TODO: set the body's position, velocity, rotation, and angular velocity to match this component's values (offset position up 1 meter)
    
    player.setController("player", character)
    this.seatedPlayer = null
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "control_seat"
}
