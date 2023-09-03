import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const _v = new THREE.Vector3();

export const G = 6.6743e-11;

export default class Body {
  /*
    mesh:      optional, rendering mesh (model & texture)
    rigidBody: optional, CannonJS physics body
  */

  constructor(data, rigidBody, mesh) {
    // --- CANNON ---
    rigidBody.linearDamping = 0  // conservation of momentum
    rigidBody.angularDamping = 0  // conservation of angular momentum
    this.rigidBody = rigidBody

    // --- THREE ---
    // may be false to indicate no mesh (if client root body)
    if(mesh) {
      this.mesh = mesh
    }

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

    this.gravityVector = new THREE.Vector3()
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

  get position() { return this.rigidBody.position }
  get velocity() { return this.rigidBody.velocity }
  get quaternion() { return this.rigidBody.quaternion }
  get angularVelocity() { return this.rigidBody.angularVelocity }

  get mass() { return this.rigidBody.mass }

  update(world, DT) {
    // copy cannon position & quaternion to three
    if(this.mesh) {
      //this.mesh.position.copy(this.rigidBody.interpolatedPosition)
      //this.mesh.quaternion.copy(this.rigidBody.interpolatedQuaternion)
      this.mesh.position.copy(this.rigidBody.position)
      this.mesh.quaternion.copy(this.rigidBody.quaternion)
    }

    if(this.rigidBody.type === CANNON.Body.DYNAMIC && world.orbitalGravityEnabled) {
      this.gravityVector.set(0, 0, 0)
      for(const otherBody of world.gravityBodies) {

        _v.copy(otherBody.position).sub(this.position) // difference in position
        const rSquared = _v.lengthSq() // distance squared
        _v.normalize()                 // direction of force

        // force
        _v.multiplyScalar(G * this.mass * otherBody.mass / rSquared)

        // acceleration
        _v/*.divideScalar(this.mass)*/.multiplyScalar(DT)

        // save the gravity vector with the highest magnitude
        if(_v.lengthSq() >= this.gravityVector.lengthSq()) {
          this.gravityVector.copy(_v)
        }

        // apply gravity
        this.rigidBody.applyImpulse(_v)
      }
    }
  }
}