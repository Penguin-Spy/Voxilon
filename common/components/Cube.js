import { Vec3, Box } from 'cannon-es'
import { BoxGeometry, Mesh } from 'three'
import Component from "/common/Component.js"
import { DEBUG_COMPASS } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions } from '/common/util.js'

const geometry = new BoxGeometry(1, 1, 1)
const mesh = new Mesh(geometry, DEBUG_COMPASS)

const [boundingBox] = boundingBoxFromDimensions(1, 1, 1)
const type = "voxilon:cube"

export default class Cube extends Component {
  constructor(data) {
    const halfExtents = new Vec3(0.5, 0.5, 0.5)
    const boxShape = new Box(halfExtents)

    super(data, boxShape, mesh.clone())
    // read-only properties
    Object.defineProperties(this, {
      type: { enumerable: true, value: type },
      boundingBox: { enumerable: true, value: boundingBox }
    })
  }

  static type = type
  static boundingBox = boundingBox
  static previewMesh = mesh.clone()
}