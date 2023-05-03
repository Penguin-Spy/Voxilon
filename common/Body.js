import * as CANNON from 'cannon';
import * as THREE from 'three';

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
const absoluteDefaultMesh = new THREE.Mesh(geometry, material)

const _v = new THREE.Vector3();

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

  update(world) {
    // copy cannon position & quaternion to three
    if(this.mesh) {
      this.mesh.position.copy(this.position)
      this.mesh.quaternion.copy(this.quaternion)
    }

    // get direction from body to gravity center
    this.gravityVector.copy(world.gravityPoint).sub(this.position).normalize()
    // calculate and apply gravity
    _v.copy(this.gravityVector).multiplyScalar(world.gravityStrength)
    this.rigidBody.applyForce(_v)
  }
}