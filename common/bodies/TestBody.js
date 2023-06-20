import * as CANNON from 'cannon'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { ground } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'
import { debugGrid, debugCompass } from "/common/RenderMaterials.js"

const geometry = new THREE.BoxGeometry(2, 2, 2);
const staticMesh = new THREE.Mesh(geometry, debugCompass)
const dynamicMesh = new THREE.Mesh(geometry, debugGrid)

export default class TestBody extends Body {
  
  constructor(data) {
    const static_is_a_reserved_identifier = check(data.static, "boolean")
    
    const rigidBody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Sphere(1),
      material: ground,
      type: static_is_a_reserved_identifier ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
    })
    
    super(data, rigidBody, static_is_a_reserved_identifier ? staticMesh.clone() : dynamicMesh.clone())
    this.static = static_is_a_reserved_identifier
  }

  get type() { return "voxilon:test_body" }
  serialize() {
    const data = super.serialize()
    data.static = this.static
    return data
  }
}