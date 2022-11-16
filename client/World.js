import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import Quaternion from '../common/Quaternion.js';
import CelestialBody from '../common/CelestialBody.js';
import Mesh from '../common/Mesh.js';
import Texture from '../client/Texture.js';

export default class World {
  bodies = [];
  rootBody; // The one body this ClientWorld manages & sends packets about
  #physics;
  session;
  #tickTimeout;

  constructor(session) {
    this.session = session;
    this.#physics = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0) // m/s²
    });
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
      shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
    this.#physics.addBody(groundBody);

    this.tick();
  }

  // clientside
  setBody = (bodyID, position, quaternion, meshType, textureUrl, selfBody) => {
    let mesh;
    if (!selfBody) {
      mesh = new Mesh(meshType, new Texture(textureUrl));
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
    this.#physics.addBody(sphereBody);

    this.bodies[bodyID] = new CelestialBody(sphereBody, mesh);
    if (selfBody) {
      this.rootBody = this.bodies[bodyID];
      this.rootBody.id = bodyID;
    }
  };

  // bi
  getBody = bodyID => {
    return this.bodies[bodyID];
  };

  // packet queue
  /*queuePacket = (decodedPacket) => {
    alert(decodedPacket.type)
    #packetQueue[decodedPacket.type]
    
  }*/

  // everthing below is bi
  moveBody = (bodyID, position, velocity) => {
    if (this.bodies[bodyID]) {
      this.bodies[bodyID].position = position;
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
  rotateBody = (bodyID, quaternion, angularVelocity) => {
    if (this.bodies[bodyID]) {
      this.bodies[bodyID].quaternion = quaternion;
      this.bodies[bodyID].angularVelocity = angularVelocity;
    }
  };

  removeBody = bodyID => {
    delete this.bodies[bodyID];
  };
  tick = () => {
    this.#tickTimeout = setTimeout(this.tick, 1000 / 60);

    this.#physics.fixedStep();

    if (this.rootBody) {
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
    }
  };

  close = () => {
    clearTimeout(this.#tickTimeout);
  };
}
