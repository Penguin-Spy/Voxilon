import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';

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

  }

  get bodies() { return this._bodies }

  addBody(celestialBody) {
    this._physics.addBody(celestialBody.rigidBody)
    return this._bodies.push(celestialBody)
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
    this._physics.fixedStep()

    /*if (this.rootBody) {
      // rootBody.id is not a field of CelestialBody, it's set in world.setBody(selfBody=true)
      this.session.moveBody(
        this.rootBody.id,
        this.rootBody.position,
        this.rootBody.velocity
      );
      this.session.rotateBody(
        this.rootBody.id,
        this.rootBody.quaternion,
        this.rootBody.angularVelocity
      );
    }*/
  }
}
