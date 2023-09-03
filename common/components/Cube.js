import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Component from "/common/Component.js";
import { DEBUG_COMPASS } from "/common/RenderMaterials.js"

const geometry = new THREE.BoxGeometry(1, 1, 1);
const mesh = new THREE.Mesh(geometry, DEBUG_COMPASS)

export default class Cube extends Component {
  constructor(data) {
    const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5)
    const boxShape = new CANNON.Box(halfExtents)

    super(data, boxShape, mesh.clone())
  }

  get type() { return "voxilon:cube" }
  /*serialize() {
    const data = super.serialize()
    return data
  }*/
}