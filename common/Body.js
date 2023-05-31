import * as CANNON from 'cannon';
import * as THREE from 'three';
import { ground } from "/common/Materials.js";

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
const absoluteDefaultMesh = new THREE.Mesh(geometry, material)

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export const G = 6.6743e-11;

export default class Body {
  /*
    mesh:      optional, rendering mesh (model & texture)
    rigidBody: optional, CannonJS physics body
  */

  constructor(cannonOptions, defaultMesh) {
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
    if(defaultMesh === undefined) {
      console.warn("[%s] Creating rigidbody with default mesh!", this.constructor.name)
      defaultMesh = absoluteDefaultMesh
    }
    // may be false to indicate no mesh (if client root body)
    if(defaultMesh) {
      this.mesh = defaultMesh.clone()
    }
  }

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

        // difference in position
        _v1.copy(otherBody.position).sub(this.position)

        const rSquared = _v1.lengthSq() // distance squared
        _v2.copy(_v1).normalize()       // direction of force

        // force
        _v2.multiplyScalar(G * this.mass * otherBody.mass / rSquared)

        // acceleration
        _v2/*.divideScalar(this.mass)*/.multiplyScalar(DT)

        //console.log(this.rigidBody.id, _v2)
        
        this.gravityVector.copy(_v2)
        //this.rigidBody.applyForce(_v2)
        this.rigidBody.applyImpulse(_v2)
        
        // calculate and apply gravity
        //_v1.copy(this.gravityVector).multiplyScalar(world.gravityStrength)
        //this.rigidBody.applyForce(_v1)
        
      }
    }
  }
}