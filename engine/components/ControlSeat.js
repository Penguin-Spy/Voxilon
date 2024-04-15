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

  // stores the body of the character that is in this seat for serializing
  storeBody(characterBody) {
    this.storedCharacterBody = characterBody
    this.world.removeBody(characterBody)
  }

  // gets the body of the character in this seat and removes it from being stored
  retrieveBody() {
    const body = this.storedCharacterBody
    this.storedCharacterBody = null
    this.world.addBody(body)
    // TODO: set the body's position, velocity, rotation, and angular velocity to match this component's values (offset position up 1 meter)
    return body
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "control_seat"
}
