import { Vec3, Box } from 'cannon'
import { BoxGeometry, Mesh } from 'three'
import Component from "/common/Component.js"
import { DEBUG_COMPASS } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'

const geometry = new BoxGeometry(1, 1, 1)
const mesh = new Mesh(geometry, DEBUG_COMPASS)

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:cube"

export default class Cube extends Component {
  constructor(data) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, boxShape, mesh.clone())
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)
}
