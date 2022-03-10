import * as CANNON from './common/cannon-es'
import Quaternion from './common/Quaternion'
import CelestialBody from './common/CelestialBody'
import Mesh from './common/Mesh'
import Texture from './client/Texture'

export default class World {
    bodies = []
    #physics
    session
    #tickTimeout
    #serverside

    constructor(serverside, session) {
      this.#serverside = serverside
      if(serverside) {
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
        new Mesh(meshType, new Texture(textureUrl))
      )) - 1;
    }

    // clientside
    setBody = (bodyID, position, quaternion, meshType, textureUrl, selfBody) => {
      let mesh
      if(!selfBody) {
        mesh = new Mesh(meshType, new Texture(textureUrl))
      }
      
      this.bodies[bodyID] = new CelestialBody(
          {
            position,
            quaternion: new Quaternion(quaternion)
          },
          mesh
        );
    }

    // bi
    getBody = (bodyID) => {
      return this.bodies[bodyID];
    }

    // everthing below is bi
    moveBody = (bodyID, position, velocity) => {
      this.bodies[bodyID].position = position;
      //this.bodies[bodyID-1].velocity = velocity;
    }
    moveBodyRelative = (bodyID, position) => {
      let pos = this.bodies[bodyID].position
      pos.x += position.x
      pos.y += position.y
      pos.z += position.z
      this.bodies[bodyID].position = pos
    }
    rotateBody = (bodyID, quaternion) => {
      this.bodies[bodyID].quaternion = quaternion;
    }

    removeBody = (bodyID) => {
      delete this.bodies[bodyID];
    }

    // Update positions
    /*tick = () => {
      // Movement is done like this so it occurs in discrete steps
      // and is not affected by the bodies' index in the array.

      // Calculate movement for this tick
      for(body of this.bodies) {
        body.moveCalc();
      }
      // Run update() with valid calculatedMovement data (just becuz, it really shouldn't matter).
      for(body of this.bodies) {
        body.update();
      }
      // Apply movement for this tick
      for(body of this.bodies) {
        body.moveApply();
      }
    }*/
    tick = () => {
      this.#tickTimeout = setTimeout(this.tick, 1000/60)

      this.#physics.fixedStep()

      this.bodies.forEach((body, id) => {
          this.session.moveBody(id, body.position, new Float64Array([0,0,0]))

          this.session.rotateBody(id, body.quaternion.inverse())
      })
    }

    close = () => {
      clearTimeout(this.#tickTimeout)
    }
  }