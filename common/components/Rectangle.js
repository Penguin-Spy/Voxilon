import { Vec3, Box } from 'cannon'
import { BoxGeometry, Mesh } from 'three'
import Component from "/common/Component.js"
import { DEBUG_GRID } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'

const geometry = new BoxGeometry(1, 1, 2)
const mesh = new Mesh(geometry, DEBUG_GRID)

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 2)
const type = "voxilon:rectangle"

export default class Rectangle extends Component {
  constructor(data, world) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 1))

    super(data, world, boxShape, mesh.clone())
  }

  static type = type
  static mass = 4
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)
}
