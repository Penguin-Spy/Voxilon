import * as CANNON from 'cannon';
import * as THREE from 'three';

export default class World {
  constructor() {
    this._bodies = []

    this.gravityPoint = new THREE.Vector3(0, 0, 0);
    this.gravityStrength = 9.8 // m/s²

    // --- CANNON ---
    
    this._physics = new CANNON.World({
      frictionGravity: new CANNON.Vec3(0, -9.82, 0) // direction doesn't matter, only magnitude is used in friction calculations
    });

    const physicsMaterial = new CANNON.Material("slipperyMaterial");
    const physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
      physicsMaterial,
      {
        friction: 0.0, // friction coefficient
        restitution: 0.3  // restitution
      }
    );
    // We must add the contact materials to the world
    this._physics.addContactMaterial(physicsContactMaterial);

    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Sphere(10)
    })
    this._physics.addBody(groundBody);


    // --- THREE ---
    
    this.scene = new THREE.Scene();
    //this.scene.background = new THREE.Color("#87CEEB")

    const material = new THREE.MeshBasicMaterial( {color: 0x3CCC00, side: THREE.DoubleSide} );
    const geometry = new THREE.SphereGeometry( 10, 32, 16 )
    const groundMesh = new THREE.Mesh(geometry, material)
    this.scene.add(groundMesh);
  }

  get bodies() { return this._bodies }

  addBody(body) {
    this._physics.addBody(body.rigidBody)
    if(body.mesh) this.scene.add(body.mesh)
    return this._bodies.push(body)
  }

  getBody(bodyID) {
    return this._bodies[bodyID]
  };

  moveBody(bodyID, position, velocity) {
    console.warn("World:moveBody called")
    const body = this._bodies[bodyID];
    if (body) {
      body.position = position;
      body.velocity = velocity
    }
  };
  rotateBody(bodyID, quaternion, angularVelocity) {
    console.warn("World:rotateBody called")
    const body = this._bodies[bodyID];
    if (body) {
      body.quaternion = quaternion;
      body.angularVelocity = angularVelocity;
    }
  };

  removeBody(bodyID) {
    const body = this._bodies[bodyID];
    this._physics.removeBody(body.rigidBody)
    if(body.mesh)this.scene.remove(body.mesh)
    delete this._bodies[bodyID];
  }
  step(dt) {
    // updates THREE meshes & calculates gravity
    this._bodies.forEach(body => {
      body.update(this, dt)
    })

    this._physics.fixedStep()
  }
}
