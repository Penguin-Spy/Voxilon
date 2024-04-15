import { Vec3, Box } from 'cannon'
import { BoxGeometry, Mesh } from 'three'
import Component from 'engine/Component.js'
import { DEBUG_COMPASS } from 'engine/RenderMaterials.js'
import { boundingBoxFromDimensions, generatePreviewMesh } from 'engine/components/componentUtil.js'

const geometry = new BoxGeometry(1, 1, 1)
const mesh = new Mesh(geometry, DEBUG_COMPASS)

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:cube"

export default class Cube extends Component {
  constructor(data, world) {
    const boxShape = new Box(new Vec3(0.5, 0.5, 0.5))

    super(data, world, boxShape, mesh.clone())
  }

  static type = type
  static mass = 1
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = generatePreviewMesh(mesh)
}
