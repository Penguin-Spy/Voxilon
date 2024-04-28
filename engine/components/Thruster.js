import { Vec3, Box } from 'cannon-es'
import NetworkedComponent from 'engine/NetworkedComponent.js'
import { boundingBoxFromDimensions, generatePreviewMesh } from 'engine/components/componentUtil.js'
import { loadGLTF } from 'engine/ModelLoader.js'

const mesh = await loadGLTF("/assets/components/thruster.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:thruster"

export default class Thruster extends NetworkedComponent {
  constructor(data, world) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, world, boxShape, mesh.clone())

    this.maxThrust = 2000 // in Newtons (kg*m/s²)
  }

  serializeNetwork() { }
  reviveNetwork() { }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)

  static hostnamePrefix = "thruster"
}
