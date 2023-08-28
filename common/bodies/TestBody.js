import * as CANNON from 'cannon'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { GROUND } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'
import { DEBUG_GRID, DEBUG_COMPASS } from "/common/RenderMaterials.js"

const geometry = new THREE.BoxGeometry(2, 2, 2);
const staticMesh = new THREE.Mesh(geometry, DEBUG_COMPASS)
const dynamicMesh = new THREE.Mesh(geometry, DEBUG_GRID)

export default class TestBody extends Body {

  constructor(data) {
    const is_static = check(data.is_static, "boolean")

    const rigidBody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Sphere(1),
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