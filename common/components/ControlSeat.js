import { Vector3 } from 'three'
import { Vec3, Box } from 'cannon'
import NetworkedComponent from "/common/NetworkedComponent.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'
import { loadGLTF } from '/common/ModelLoader.js'
import ThrustManager from '/common/ThrustManager.js'
import GyroManager from '/common/GyroManager.js'

const mesh = await loadGLTF("/assets/components/control_seat.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:control_seat"

export default class ControlSeat extends NetworkedComponent {
  constructor(data, world) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, world, boxShape, mesh.clone())
    this.lookPositionOffset = new Vector3(0, 0.3, 0)

    this.thrustManager = new ThrustManager(this)
    this.gyroManager = new GyroManager(this)
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

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "control_seat"
}
