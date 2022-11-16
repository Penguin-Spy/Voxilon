import * as CANNON from 'cannon-es'
import Quaternion from '../common/Quaternion.mjs'
import CelestialBody from '../common/CelestialBody.mjs'
import Mesh from '../common/Mesh.mjs'
import Texture from '../client/Texture.mjs'

export default class World {
    bodies = []
    #physics
    session
    #tickTimeout

    constructor(session) {
      this.session = session
      this.#physics = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
      })
      const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
        shape: new CANNON.Plane(),
      })
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
      this.#physics.addBody(groundBody)

      this.tick()
    }

    // serverside
    addBody = (position, quaternion, meshType, textureUrl, player) => {
      const sphereBody = new CANNON.Body({
          mass: 1, // kg
          shape: new CANNON.Sphere(1),
          allowSleep: true,        
          angularFactor: player ? {x:0, y:1, z:0} : {x:1, y:1, z:1}
      })
      sphereBody.position.set(position.x, position.y, position.z) // m
      sphereBody.quaternion.set(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
      this.#physics.addBody(sphereBody)

      sphereBody.addEventListener(sphereBody.sleepyEvent, function() {
        console.log("zzz")
      })

      return this.bodies.push(new CelestialBody(
        sphereBody,
        new Mesh(meshType, textureUrl)
      )) - 1;
    }

    // bi
    getBody = (bodyID) => {
      return this.bodies[bodyID];
    }

    // everthing below is bi
    moveBody = (bodyID, position, velocity) => {
      if(this.bodies[bodyID]) {
        this.bodies[bodyID].position = position;
        this.bodies[bodyID].velocity = velocity;
      }
      //this.bodies[bodyID-1].velocity = velocity;
    }
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
      if(this.bodies[bodyID]) {
        this.bodies[bodyID].quaternion = quaternion;
        this.bodies[bodyID].angularVelocity = angularVelocity;
      }
    }

    removeBody = (bodyID) => {
      delete this.bodies[bodyID];
    }

    tick = () => {
      this.#tickTimeout = setTimeout(this.tick, 1000/60)

      this.#physics.fixedStep()

      this.bodies.forEach((body, id) => {
        this.session.moveBody(id, body.position, body.velocity)

        this.session.rotateBody(id, body.quaternion, body.angularVelocity)
      })
    }

    close = () => {
      clearTimeout(this.#tickTimeout)
    }
  }