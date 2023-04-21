import * as CANNON from 'cannon';
import * as THREE from 'three';

const dt = 1 / 60

export default class World {
  constructor() {
    this._bodies = []

    this._physics = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0) // m/s²
    });

    const physicsMaterial = new CANNON.Material("slipperyMaterial");
    const physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
      physicsMaterial,
      {
        friction: 0.0, // friction coefficient
        restitution: 0.3  // restitution}
      }
    );
    // We must add the contact materials to the world
    this._physics.addContactMaterial(physicsContactMaterial);


    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
    this._physics.addBody(groundBody);

    this.scene = new THREE.Scene();
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
    if (this._bodies[bodyID]) {
      this._bodies[bodyID].position = position;
      this._bodies[bodyId].velocity = velocity
    }
  };
  rotateBody(bodyID, quaternion, angularVelocity) {
    if (this._bodies[bodyID]) {
      this._bodies[bodyID].quaternion = quaternion;
      this._bodies[bodyID].angularVelocity = angularVelocity;
    }
  };

  removeBody(bodyID) {
    delete this._bodies[bodyID];
  }
  step(frameTime) {
    for(const body of this._bodies) {
      body.update()
    }

    this._physics.fixedStep()
  }
}
