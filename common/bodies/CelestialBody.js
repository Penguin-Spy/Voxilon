import * as CANNON from 'cannon';
import * as THREE from 'three';
import { default as Body, G } from '/common/Body.js'

const material = new THREE.MeshBasicMaterial({color: 0x3CCC00})

export default class CelestialBody extends Body {
  
  constructor(radius, surfaceGravity) {
    const geometry = new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, material)

    const mass = surfaceGravity * radius * radius / G
    
    super({
      mass: mass, // kg
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC
    }, mesh)
  }

  /*update(world, dt) {
    super(world, dt)
  }*/
}