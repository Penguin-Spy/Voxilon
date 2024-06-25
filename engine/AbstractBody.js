// TODO: Vector3 stuff
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { check } from 'engine/util.js';

export default class AbstractBody {
  /** @type {CANNON.Body} */
  rigidBody

  position; velocity; quaternion; angularVelocity
  /** @type {number} */
  id

  /**
   * @param {object} data
   * @param {CANNON.Body} rigidBody
   * @param {World} world
   */
  constructor(data, world, rigidBody, id) {
    // --- CANNON ---
    rigidBody.linearDamping = 0  // conservation of momentum
    rigidBody.angularDamping = 0  // conservation of angular momentum

    this.world = world
    this.id = check(id, "number")

    // read-only properties
    /** @readonly */ this.rigidBody = rigidBody
    /** @readonly */ this.position = rigidBody.position
    /** @readonly */ this.velocity = rigidBody.velocity
    /** @readonly */ this.quaternion = rigidBody.quaternion
    /** @readonly */ this.angularVelocity = rigidBody.angularVelocity

    data = { // default values
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      quaternion: [0, 0, 0, 1],  // the identity quaternion
      angularVelocity: [0, 0, 0],
      ...data  // then overwrite with existing data values
    }

    this.position.set(...data.position)
    this.velocity.set(...data.velocity)
    this.quaternion.set(...data.quaternion)
    this.angularVelocity.set(...data.angularVelocity)

    // abstract body or abstract server body?
    this.gravityDirection = new THREE.Vector3()
    this.totalGravityVector = new THREE.Vector3()
  }

  // or step, or maybe a callback on the cannon rigidbody?
  update() {
    // gravity stuff
  }

}
