import * as CANNON from 'cannon';
import * as THREE from 'three';
import Quaternion from '/common/Quaternion.js'

export default class Body {
  /*
    mesh:      optional, rendering mesh (model & texture)
    rigidBody: optional, CannonJS physics body
  */

  constructor(cannonOptions, mesh) {
    console.log("constructing body with mesh:", mesh)
    if (cannonOptions.shape === undefined) {
      console.warn("[%s] Creating rigidbody with default shape!", this.constructor.name)
      cannonOptions.shape = new CANNON.Sphere(1)
    }
    cannonOptions.linearDamping = 0  // conservation of momentum
    cannonOptions.angularDamping = 0  // conservation of angular momentum

    this.rigidBody = new CANNON.Body(cannonOptions)

    // may be undefined (if client root body)

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.mesh = new THREE.Mesh(geometry, material)
  }

  get position() {
    return this.rigidBody.position
  }
  set position(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z)) throw new TypeError(`setting body position to NaN (${value.x},${value.y},${value.z})`)
    
    // cannon
    if (this.rigidBody.position.set) {
      this.rigidBody.position.set(
        value.x,
        value.y,
        value.z
      )
    } else {
      console.warn("setting position of rigidbody directly")
      this.rigidBody.position = value
    }
  }
  get velocity() {
    return this.rigidBody.velocity
  }
  set velocity(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z)) throw new TypeError(`setting body velocity to NaN (${value.x},${value.y},${value.z})`)
    this.rigidBody.velocity.set(
      value.x,
      value.y,
      value.z
    )
  }

  get quaternion() {
    return this.rigidBody.quaternion
  }

  set quaternion(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z) || isNaN(value.w)) throw new TypeError(`setting body quaternion to NaN (${value.x},${value.y},${value.z},${value.w})`)

    // cannon
    if (this.rigidBody.quaternion.set) {
      this.rigidBody.quaternion.set(
        value.x,
        value.y,
        value.z,
        value.w
      )
    } else {
      console.warn("setting quaternion fields of rigidbody directly")
      this.rigidBody.quaternion.x = value.x
      this.rigidBody.quaternion.y = value.y
      this.rigidBody.quaternion.z = value.z
      this.rigidBody.quaternion.w = value.w
    }
    this.rigidBody.quaternion = this.rigidBody.quaternion.normalize()
  }
  get angularVelocity() {
    return this.rigidBody.angularVelocity
  }
  set angularVelocity(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z)) throw new TypeError(`setting body anglularVelocity to NaN (${value.x},${value.y},${value.z})`)
    this.rigidBody.angularVelocity.set(
      value.x,
      value.y,
      value.z
    )
  }

  update() {
    // copy cannon position & quaternion to three
    this.mesh.quaternion.set(this.quaternion.x, this.quaternion.y, this.quaternion.z, this.quaternion.w)
    this.mesh.position.set(this.position.x, this.position.y, this.position.z)
  }
}