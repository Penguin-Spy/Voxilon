// TODO: Vector3 stuff
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { check, DT } from 'engine/util.js'

const _v = new THREE.Vector3()

export const G = 6.6743e-11

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

  calculateGravity() {
    if(this.rigidBody.type === CANNON.Body.DYNAMIC) {
      this.gravityDirection.set(0, 0, 0)
      this.totalGravityVector.set(0, 0, 0)
      for(const otherBody of this.world.gravityBodies) {

        _v.copy(otherBody.position).sub(this.position) // difference in position
        const rSquared = _v.lengthSq() // distance squared
        _v.normalize()                 // normalize for just the direction of force

        // force
        _v.multiplyScalar(G * this.rigidBody.mass * otherBody.rigidBody.mass / rSquared)

        // acceleration
        _v.multiplyScalar(DT)

        // save the gravity vector with the highest magnitude
        if(_v.lengthSq() >= this.gravityDirection.lengthSq()) {
          this.gravityDirection.copy(_v)
        }

        // add to total gravity
        this.totalGravityVector.add(_v)
      }
    }
  }

  applyGravity() {
    this.rigidBody.applyImpulse(this.totalGravityVector)
  }
}
