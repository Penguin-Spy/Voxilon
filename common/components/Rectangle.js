import { Vec3, Box } from 'cannon-es'
import { BoxGeometry, Mesh, Group } from 'three'
import Component from "/common/Component.js"
import { DEBUG_GRID } from "/common/RenderMaterials.js"
import { boundingBoxFromDimensions } from '/common/util.js'

const geometry = new BoxGeometry(1, 1, 2)
const mesh = new Mesh(geometry, DEBUG_GRID)
//realMesh.position.set(0, 0, 0.5)
//const mesh = new Group().add(realMesh) // offset mesh so it's position (center) is equal to the Component's position

const [boundingBox, offset] = boundingBoxFromDimensions(1, 1, 2)
const type = "voxilon:rectangle"

export default class Rectangle extends Component {
  constructor(data) {
    const halfExtents = new Vec3(0.5, 0.5, 1)
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
  static previewMesh = mesh.clone()
}