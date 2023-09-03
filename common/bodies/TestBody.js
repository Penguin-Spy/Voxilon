import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { GROUND } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'
import { DEBUG_GRID, DEBUG_COMPASS } from "/common/RenderMaterials.js"

const geometry = new THREE.BoxGeometry(1, 1, 1);
const staticMesh = new THREE.Mesh(geometry, DEBUG_COMPASS)
const dynamicMesh = new THREE.Mesh(geometry, DEBUG_GRID)

export default class TestBody extends Body {

  constructor(data) {
    const is_static = check(data.is_static, "boolean")

    let shape
    if(data.use_box) {
      const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5)
      shape = new CANNON.Box(halfExtents)
    } else {
      shape = new CANNON.Sphere(1)
    }

    const rigidBody = new CANNON.Body({
      mass: 1, // kg
      shape: shape,
      material: GROUND,
      type: is_static ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
    })

    super(data, rigidBody, is_static ? staticMesh.clone() : dynamicMesh.clone())
    this.is_static = is_static
  }

  get type() { return "voxilon:test_body" }
  serialize() {
    const data = super.serialize()
    data.is_static = this.is_static
    return data
  }
}