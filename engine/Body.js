/** @typedef {import('engine/World.js').default} World */

import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { DT } from 'engine/util.js'

const _v = new THREE.Vector3()

export const G = 6.6743e-11

/**
 * @typedef {object} BodyData
 * @property {number?} id
 * @property {[number,number,number]} position
 * @property {[number,number,number]} velocity
 * @property {[number,number,number,number]} quaternion
 * @property {[number,number,number]} angularVelocity
 */

/**
 * Base class for all independent objects in the World
 */
export default class Body {
  /** @type {CANNON.Body} */
  rigidBody
  /** @type {THREE.Mesh|undefined} may be undefined if the body has no mesh*/
  mesh
  /** @type {string} @readonly */
  type

  /**
   * @param {BodyData} data
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
    this.id = data.id ?? world.getNextBodyID() // generate a new body id if necessary

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

    this.gravityDirection = new THREE.Vector3()
    this.totalGravityVector = new THREE.Vector3()
  }

  serialize() {
    const data = {}
    data.type = this.type
    data.id = this.id
    data.position = this.position.toArray()
    data.velocity = this.velocity.toArray()
    data.quaternion = this.quaternion.toArray()
    data.angularVelocity = this.angularVelocity.toArray()
    return data
  }

  /** Sends the encoded packet to this body on all client's worlds
   * @param {Object} packet Must be a `SYNC_something` packet that the NetworkLink will call receiveSelfSync with
   */
  sendSelfSync(packet) {
    this.world.link.broadcast(packet)
  }
  /** Receives the sync data. This method must be overridden in all Body subclasses */
  receiveSelfSync(packet) {
    throw new TypeError(`receiveSelfSync not implemented for ${this.constructor.name}`)
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
