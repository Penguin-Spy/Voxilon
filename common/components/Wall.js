import { Vec3, Box } from 'cannon-es'
import { BoxGeometry, Mesh } from 'three'
import Component from "/common/Component.js"
import { DEBUG_GRID } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions } from '/common/components/componentUtil.js'

const geometry = new BoxGeometry(2, 2, 3)
const mesh = new Mesh(geometry, DEBUG_GRID)

const [boundingBox, offset] = boundingBoxFromDimensions(2, 2, 3)
const type = "voxilon:wall"

export default class Wall extends Component {
  constructor(data) {
    const halfExtents = new Vec3(1, 1, 1.5)
    const boxShape = new Box(halfExtents)

    super(data, boxShape, mesh.clone(), offset)
    // read-only properties
    Object.defineProperties(this, {
      type: { enumerable: true, value: type },
      boundingBox: { enumerable: true, value: boundingBox }
    })
  }

  static type = type
  static boundingBox = boundingBox
  static offset = offset
  static previewMesh = mesh.clone()
}