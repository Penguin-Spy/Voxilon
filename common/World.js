import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import Quaternion from '../common/Quaternion.js';
import CelestialBody from '../common/CelestialBody.js';
//import Mesh from '../common/Mesh.js';

export default class World {
  _bodies = []
  _physics
  //tickTimeout

  constructor() {
    this._physics = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0) // m/s²
    });
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
    this._physics.addBody(groundBody);

    //this.tick();
  }

  get bodies() { return this._bodies }

  addBody(celestialBody) {
    this._physics.addBody(celestialBody.rigidBody)
    return this._bodies.push(celestialBody)
  }

  /*setBody = (bodyID, position, quaternion, meshType, textureUrl, selfBody) => {
    let mesh;
    if (!selfBody) {
      //mesh = new Mesh(meshType, new Texture(textureUrl));
    }
    const sphereBody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Sphere(1),
      allowSleep: true,
      angularFactor: selfBody ? { x: 0, y: 1, z: 0 } : { x: 1, y: 1, z: 1 }
    });
    sphereBody.position.set(position.x, position.y, position.z); // m
    sphereBody.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
    this._physics.addBody(sphereBody);

    this._bodies[bodyID] = new CelestialBody(sphereBody, mesh);
    if (selfBody) {
      this.rootBody = this.bodies[bodyID];
      this.rootBody.id = bodyID;
    }
  };*/

  // bi
  getBody(bodyID) {
    return this._bodies[bodyID]
  };

  // everthing below is bi
  moveBody(bodyID, position, velocity) {
    if (this._bodies[bodyID]) {
      this._bodies[bodyID].position = position;
      this._bodies[bodyId].velocity = velocity
    }
    //this.bodies[bodyID-1].velocity = velocity;
  };
	/*moveBodyRelative = (bodyID, position) => {
      if(this.bodies[bodyID]) {
        let pos = this.bodies[bodyID].position
        pos.x += position.x
        pos.y += position.y
        pos.z += position.z
        this.bodies[bodyID].position = pos
      }
    }*/
  rotateBody(bodyID, quaternion, angularVelocity) {
    if (this._bodies[bodyID]) {
      this._bodies[bodyID].quaternion = quaternion;
      this._bodies[bodyID].angularVelocity = angularVelocity;
    }
  };

  removeBody(bodyID) {
    delete this._bodies[bodyID];
  };
  tick() {
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
