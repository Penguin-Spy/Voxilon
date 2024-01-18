import { Vec3, Box } from 'cannon'
import NetworkedComponent from "/common/NetworkedComponent.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'
import { loadGLTF } from '/common/ModelLoader.js'
import ThrustManager from '/common/ThrustManager.js'

const mesh = await loadGLTF("/assets/components/control_seat.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:control_seat"

export default class ControlSeat extends NetworkedComponent {
  constructor(data) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, boxShape, mesh.clone())

    this.thrustManager = new ThrustManager(this)
  }

  serializeNetwork() {
    return {}
  }
  reviveNetwork(netData) {
    console.log(netData)
  }

  setParent(contraption) {
    super.setParent(contraption)
    contraption.managers.push(this.thrustManager)
  }

  getManager() {
    return this.thrustManager
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "control_seat"
}
