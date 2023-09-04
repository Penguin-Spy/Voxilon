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
    const is_box = check(data.is_box, "boolean")

    let shape
    if(is_box) {
      const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5)
      shape = new CANNON.Box(halfExtents)
    } else {
      shape = new CANNON.Sphere(1)
    }

    const rigidBody = new CANNON.Body({
      mass: 1, // kg
      shape: shape,
      material: GROUND,
      type: is_static ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC,
    })

    super(data, rigidBody, is_static ? staticMesh.clone() : dynamicMesh.clone())
    // read-only properties
    Object.defineProperties(this, {
      type: { enumerable: true, value: "voxilon:test_body" },
      is_static: { enumerable: true, value: is_static },
      is_box: { enumerable: true, value: is_box },
    })
  }

  serialize() {
    const data = super.serialize()
    data.is_static = this.is_static
    data.is_box = this.is_box
    return data
  }
}