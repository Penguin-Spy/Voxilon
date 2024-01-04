import { Vec3, Box } from 'cannon'
import { Group } from 'three'
import Component from "/common/Component.js"
import { DEBUG_COMPASS } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'
import { loadGLTF } from '/common/ModelLoader.js'

const mesh = await loadGLTF("/assets/components/thruster.gltf")

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:thruster"

export default class Thruster extends Component {
  constructor(data) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, boxShape, mesh.clone())

    this.maxThrust = 10 // unit?
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)
}
