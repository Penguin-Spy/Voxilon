import * as CANNON from 'cannon'
import * as THREE from 'three'
import CelestialBody from "/common/bodies/CelestialBody.js"
import PlayerBody from "/common/bodies/PlayerBody.js"
import TestBody from "/common/bodies/TestBody.js"
import { contactMaterials } from "/common/PhysicsMaterials.js"

const WORLD_VERSION = "alpha-0"

const constructors = {
  "voxilon:celestial_body": CelestialBody,
  "voxilon:player_body": PlayerBody,
  "voxilon:test_body": TestBody
}

export default class World {
  constructor(data) {
    if(data.VERSION !== WORLD_VERSION) throw new Error(`Unknown world version: ${data.VERSION}`)
    
    this.name = data.name ?? "A Universe" 
    this._bodies = []

    // --- CANNON ---
    this._physics = new CANNON.World({
      frictionGravity: new CANNON.Vec3(0, -9.82, 0) // direction doesn't matter, only magnitude is used in friction calculations
    })
    for(const contactMaterial of contactMaterials) {
      this._physics.addContactMaterial(contactMaterial)
    }

    // --- THREE ---
    this.scene = new THREE.Scene();


    data.bodies.forEach(b => this.loadBody(b))
  }

  serialize(noBodies = false) {
    const data = { "VERSION": WORLD_VERSION }
    data.name = this.name
    if(!noBodies) {
      data.bodies = this._bodies.map(b => b.serialize())
    }
    return data
  }

  get bodies() { return this._bodies }
  get gravityBodies() {
    return this._bodies.filter(e => {
      return e.rigidBody.type === CANNON.Body.KINEMATIC && e.rigidBody.mass > 0
    })
  }

  loadBody(data) {
    const body = new constructors[data.type](data)
    
    this._physics.addBody(body.rigidBody)
    if(body.mesh) this.scene.add(body.mesh)
    this._bodies.push(body)
    return body
  }
  
  addBody(body) {
    throw new Error("calling World:addBody")
  }

  getBody(bodyID) {
    return this._bodies[bodyID]
  }

  getBodyByType(type) {
    return this.bodies.find(b => b.type === type)
  }
  getAllBodiesByType(type) {
    return this.bodies.filter(b => b.type === type)
  }

  moveBody(bodyID, position, velocity) {
    throw new Error("World:moveBody called")
    const body = this._bodies[bodyID];
    if (body) {
      body.position = position;
      body.velocity = velocity
    }
  };
  rotateBody(bodyID, quaternion, angularVelocity) {
    throw new Error("World:rotateBody called")
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


  step(DT) {
    // updates THREE meshes & calculates gravity
    this._bodies.forEach(body => {
      body.update(this, DT)
    })

    this._physics.fixedStep(DT)
  }
}
