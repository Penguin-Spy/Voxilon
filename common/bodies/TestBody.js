import * as CANNON from 'cannon'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { ground } from "/common/Materials.js"
import { check } from '/common/util.js'

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
const mesh = new THREE.Mesh(geometry, material)

export default class TestBody extends Body {
  
  constructor(data) {
    const static_is_a_reserved_identifier = check(data.static, "boolean")
    
    const rigidBody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Sphere(1),
      material: ground,
      type: static_is_a_reserved_identifier ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
    })
    
    super(data, rigidBody, mesh.clone())
    this.static = static_is_a_reserved_identifier
  }

  get type() { return "voxilon:test_body" }
  serialize() {
    const data = super.serialize()
    data.static = this.static
    return data
  }
}