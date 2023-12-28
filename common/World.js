import * as CANNON from 'cannon'
import * as THREE from 'three'
import CelestialBody from "/common/bodies/CelestialBody.js"
import PlayerBody from "/common/bodies/PlayerBody.js"
import TestBody from "/common/bodies/TestBody.js"
import ContraptionBody from '/common/bodies/ContraptionBody.js'
import { contactMaterials } from "/common/PhysicsMaterials.js"

const WORLD_VERSION = "alpha_1" // just the data version

const constructors = {
  "voxilon:celestial_body": CelestialBody,
  "voxilon:player_body": PlayerBody,
  "voxilon:test_body": TestBody,
  "voxilon:contraption_body": ContraptionBody
}

export default class World {
  constructor(data) {
    if(data.VERSION !== WORLD_VERSION) throw new Error(`Unknown world version: ${data.VERSION}`)

    this.name = data.name ?? "A Universe"

    // --- CANNON ---
    const physics = new CANNON.World({
      frictionGravity: new CANNON.Vec3(0, -9.82, 0) // direction doesn't matter, only magnitude is used in friction calculations
    })
    for(const contactMaterial of contactMaterials) {
      physics.addContactMaterial(contactMaterial)
    }
    this.orbitalGravityEnabled = true

    // --- THREE ---
    const scene = new THREE.Scene()

    // read-only properties
    Object.defineProperties(this, {
      bodies: { enumerable: true, value: [] },
      physics: { enumerable: true, value: physics },
      scene: { enumerable: true, value: scene }
    })

    // load bodies
    data.bodies.forEach(b => this.loadBody(b))
  }

  serialize(noBodies = false) {
    const data = { "VERSION": WORLD_VERSION }
    data.name = this.name
    if(!noBodies) {
      data.bodies = this.bodies.map(b => b.serialize())
    }
    return data
  }

  /**
   * an array of all bodies that create a gravitational field
   */
  get gravityBodies() {
    return this.bodies.filter(body => {
      return body instanceof CelestialBody && body.rigidBody.mass > 0
    })
  }
  /**
   * an array of all bodies that can be built upon. used for building raycasting
   * @returns {(CelestialBody|ContraptionBody)[]}
   */
  get buildableBodies() {
    return this.bodies.filter(body => {
      return body instanceof CelestialBody || body instanceof ContraptionBody
    })
  }

  /**
   * Loads a Body's serialized form and adds it to the world
   * @param data The serialized data
   */
  loadBody(data) {
    const body = new constructors[data.type](data)

    this.physics.addBody(body.rigidBody)
    if(body.mesh) this.scene.add(body.mesh)
    this.bodies.push(body)
    return body
  }

  getBody(bodyID) {
    return this.bodies[bodyID]
  }

  getBodyByType(type) {
    return this.bodies.find(b => b.type === type)
  }
  getAllBodiesByType(type) {
    return this.bodies.filter(b => b.type === type)
  }

  removeBody(bodyID) {
    const body = this.bodies[bodyID];
    this.physics.removeBody(body.rigidBody)
    if(body.mesh) this.scene.remove(body.mesh)
    delete this.bodies[bodyID];
  }

  preRender() {
    // updates THREE meshes
    for(const body of this.bodies) {
      body.preRender()
    }
  }

  step(DT) {
    // calculates gravity & updates bodies' additional behavior (i.e. contraptions' components)
    for(const body of this.bodies) {
      body.update(this, DT)
    }

    this.physics.fixedStep(DT)
  }
}
