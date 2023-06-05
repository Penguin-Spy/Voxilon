import * as CANNON from 'cannon';
import * as THREE from 'three';
import { ground } from "/common/Materials.js";

const _v = new THREE.Vector3();

export const G = 6.6743e-11;

export default class Body {
  /*
    mesh:      optional, rendering mesh (model & texture)
    rigidBody: optional, CannonJS physics body
  */

  constructor(cannonOptions, mesh) {
    this.gravityVector = new THREE.Vector3();
    
    // --- CANNON ---
    if (cannonOptions.shape === undefined) {
      console.warn("[%s] Creating rigidbody with default shape!", this.constructor.name)
      cannonOptions.shape = new CANNON.Sphere(1)
    }
    if(cannonOptions.type === undefined) {
      cannonOptions.type = CANNON.Body.DYNAMIC
    }
    if(cannonOptions.material === undefined) {
      console.warn("[%s] Creating rigidbody with default material!", this.constructor.name)
      cannonOptions.material = ground
    }
    cannonOptions.linearDamping = 0  // conservation of momentum
    cannonOptions.angularDamping = 0  // conservation of angular momentum

    this.rigidBody = new CANNON.Body(cannonOptions)

    
    // --- THREE ---
    if(mesh === undefined) {
      console.warn("[%s] Creating rigidbody with default mesh!", this.constructor.name)
      mesh = absoluteDefaultMesh.clone()
    }
    // may be false to indicate no mesh (if client root body)
    if(mesh) {
      this.mesh = mesh
    }
  }

  static deserialize(data) {
    // todo: confirm data is in the proper format
    const body = new Body({
      mass: data.mass
    });
    body.position.set(...data.position)
    body.velocity.set(...data.velocity)
    body.quaternion.set(...data.quaternion)
    body.angularVelocity.set(...data.angularVelocity)
    return body;
  }

  // todo: remove the setter syntax, instead use the .set() method
  // this better matches the fact that these are object references
  get position() { return this.rigidBody.position }
  set position(value) { this.rigidBody.position.copy(value) }
  get velocity() { return this.rigidBody.velocity }
  set velocity(value) { this.rigidBody.velocity.copy(value) }

  get quaternion() { return this.rigidBody.quaternion }
  set quaternion(value) { this.rigidBody.quaternion.copy(value) }
  get angularVelocity() { return this.rigidBody.angularVelocity }
  set angularVelocity(value) { this.rigidBody.angularVelocity.copy(value) }

  get mass() { return this.rigidBody.mass }

  update(world, DT) {
    // copy cannon position & quaternion to three
    if(this.mesh) {
      this.mesh.position.copy(this.rigidBody.interpolatedPosition)
      this.mesh.quaternion.copy(this.rigidBody.interpolatedQuaternion)
    }

    if(this.rigidBody.type === CANNON.Body.DYNAMIC) {
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