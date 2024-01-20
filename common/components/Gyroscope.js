import { Vec3, Box } from 'cannon'
import NetworkedComponent from "/common/NetworkedComponent.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'
import { loadGLTF } from '/common/ModelLoader.js'

const mesh = await loadGLTF("/assets/components/gyroscope.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:gyroscope"

export default class Gyroscope extends NetworkedComponent {
  constructor(data) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, boxShape, mesh.clone())

    this.maxTorque = 5 // unit?
  }

  serializeNetwork() { }
  reviveNetwork() { }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "gyroscope"
}
