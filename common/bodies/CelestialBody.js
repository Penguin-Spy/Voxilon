import * as CANNON from 'cannon'
import * as THREE from 'three'
import { default as Body, G } from '/common/Body.js'
import { check } from '/common/util.js'

const material = new THREE.MeshBasicMaterial({color: 0x3CCC00})

export default class CelestialBody extends Body {
  
  constructor(data) {
    //const { radius, surfaceGravity } = data
    const radius = check(data.radius, "number")
    const surfaceGravity = check(data.surfaceGravity, "number")
    
    const geometry = new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, material)

    const mass = surfaceGravity * radius * radius / G
    
    super({
      mass: mass, // kg
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC
    }, mesh)

    this.radius = radius
    this.surfaceGravity = surfaceGravity
  }

  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    return data
  }

  /*update(world, dt) {
    super(world, dt)
  }*/
}