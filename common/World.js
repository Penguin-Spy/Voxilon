import * as CANNON from 'cannon'
import * as THREE from 'three'
import CelestialBody from "/common/bodies/CelestialBody.js"
import PlayerBody from "/common/bodies/PlayerBody.js"
import TestBody from "/common/bodies/TestBody.js"
import { contactMaterials } from "/common/Materials.js"

const constructors = {
  "voxilon:celestial_body": CelestialBody,
  "voxilon:player_body": PlayerBody,
  "voxilon:test_body": TestBody
}

export default class World {
  constructor(data) {
    if(data.VERSION !== "1.0") throw new Error(`Unknown world version: ${data.VERSION}`)
    
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
    //this.scene.background = new THREE.Color("#87CEEB")


    data.bodies.forEach(b => {
      this.addBody(new constructors[b.type](b))
    })
  }

  serialize() {
    const data = { "VERSION": "1.0" }
    data.name = this.name
    data.bodies = this._bodies.map(b => b.serialize())
    return data
  }

  get bodies() { return this._bodies }
  get gravityBodies() {
    return this._bodies.filter(e => {
      return e.rigidBody.type === CANNON.Body.KINEMATIC && e.rigidBody.mass > 0
    })
  }

  addBody(body) {
    this._physics.addBody(body.rigidBody)
    if(body.mesh) this.scene.add(body.mesh)
    return this._bodies.push(body)
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


  step(DT) {
    // updates THREE meshes & calculates gravity
    this._bodies.forEach(body => {
      body.update(this, DT)
    })

    this._physics.fixedStep(DT)
  }
}
