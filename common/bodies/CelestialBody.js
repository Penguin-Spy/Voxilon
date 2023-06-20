import * as CANNON from 'cannon'
import * as THREE from 'three'
import { default as Body, G } from '/common/Body.js'
import { ground } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'

const material = new THREE.MeshBasicMaterial({color: 0x3CCC00})

export default class CelestialBody extends Body {
  
  constructor(data) {
    const radius = check(data.radius, "number")
    const surfaceGravity = check(data.surfaceGravity, "number")
    
    const geometry = new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, material)

    const rigidBody = new CANNON.Body({
      mass: surfaceGravity * radius * radius / G,
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC,
      material: ground
    })
    
    super(data, rigidBody, mesh)

    this.radius = radius
    this.surfaceGravity = surfaceGravity
  }

  get type() { return "voxilon:celestial_body" }
  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    return data
  }

  /*update(world, DT) {
    super(world, DT)
  }*/
}