import { Vec3, Box } from 'cannon'
import { BoxGeometry, Mesh } from 'three'
import Component from "/common/Component.js"
import { wall_top, wall_bottom, wall_front, wall_back, wall_left, wall_right } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions, generatePreviewMesh } from '/common/components/componentUtil.js'

const geometry = new BoxGeometry(3, 1, 2)
const mesh = new Mesh(geometry, [
  wall_left,
  wall_right,
  wall_top,
  wall_bottom,
  wall_front,
  wall_back,
])

const [boundingBox, offset] = boundingBoxFromDimensions(3, 1, 2)
const type = "voxilon:wall"

export default class Wall extends Component {
  constructor(data, world) {
    const boxShape = new Box(new Vec3(1.5, 0.5, 1))

    super(data, world, boxShape, mesh.clone())
  }

  static type = type
  static mass = 6
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)
}
