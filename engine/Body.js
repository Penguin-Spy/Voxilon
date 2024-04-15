import * as CANNON from 'cannon'
import * as THREE from 'three'
import { DT } from 'engine/util.js'

const _v = new THREE.Vector3();

export const G = 6.6743e-11;

/**
 * Base class for all independent objects in the World
 */
export default class Body {
  /** @type {CANNON.Body} */
  rigidBody
  /** @type {THREE.Mesh|undefined} may be undefined if the body has no mesh*/
  mesh

  /**
   * @param {Object} data
   * @param {World} world
   * @param {CANNON.Body} rigidBody
   * @param {THREE.Mesh} mesh
   */
  constructor(data, world, rigidBody, mesh) {
    // --- CANNON ---
    rigidBody.linearDamping = 0  // conservation of momentum
    rigidBody.angularDamping = 0  // conservation of angular momentum

    // --- THREE ---
    // may be false to indicate no mesh (if client root body)
    if(mesh) {
      Object.defineProperty(this, "mesh", { enumerable: true, value: mesh })
    }

    this.world = world

    // read-only properties
    Object.defineProperties(this, {
      rigidBody: { enumerable: true, value: rigidBody },
      position: { enumerable: true, value: rigidBody.position },
      velocity: { enumerable: true, value: rigidBody.velocity },
      quaternion: { enumerable: true, value: rigidBody.quaternion },
      angularVelocity: { enumerable: true, value: rigidBody.angularVelocity }
    })

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

    this.gravityDirection = new THREE.Vector3()
    this.totalGravityVector = new THREE.Vector3()
  }

  serialize() {
    const data = {}
    data.type = this.type
    data.position = this.position.toArray()
    data.velocity = this.velocity.toArray()
    data.quaternion = this.quaternion.toArray()
    data.angularVelocity = this.angularVelocity.toArray()
    // data.mass = this.mass
    return data
  }

  /**
   * Updates the total mass and center of mass of this body if relevant
   */
  updateMassProperties() {
    // no effect for most Bodies
  }

  preRender() {
    // copy cannon position & quaternion to three
    if(this.mesh) {
      this.mesh.position.copy(this.rigidBody.interpolatedPosition)
      this.mesh.quaternion.copy(this.rigidBody.interpolatedQuaternion)
    }
  }

  // updates this body's gravityDirection & totalGravity vectors
  update() {
    if(this.rigidBody.type === CANNON.Body.DYNAMIC && this.world.orbitalGravityEnabled) {
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

  postUpdate() {
    this.rigidBody.applyImpulse(this.totalGravityVector)
  }
}
