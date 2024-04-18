import Body from 'engine/Body.js'

import * as CANNON from 'cannon'
import * as THREE from 'three'
import { CircularQueue, DT } from 'engine/util.js'
import CelestialBody from 'engine/bodies/CelestialBody.js'
import CharacterBody from 'engine/bodies/CharacterBody.js'
import TestBody from 'engine/bodies/TestBody.js'
import ContraptionBody from 'engine/bodies/ContraptionBody.js'
import { contactMaterials } from 'engine/PhysicsMaterials.js'

const WORLD_VERSION = "alpha_1" // just the data version

const constructors = {
  "voxilon:celestial_body": CelestialBody,
  "voxilon:character_body": CharacterBody,
  "voxilon:test_body": TestBody,
  "voxilon:contraption_body": ContraptionBody
}

export default class World {
  /** @type {Body[]} */
  bodies

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

    this.nextBodyID = 0 // unique across all bodies
    this.nextComponentID = 0 // unique across all components

    this.netSyncQueue = new CircularQueue()

    // load bodies
    data.bodies.forEach(b => this.loadBody(b))

    this.spawn_point = new THREE.Vector3(...data.spawn_point)
  }

  serialize() {
    const data = { "VERSION": WORLD_VERSION }
    data.name = this.name
    data.spawn_point = this.spawn_point.toArray()
    data.bodies = this.bodies.map(b => b.serialize())
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
   * an array of all bodies that can be interacted with. used for interaction raycasting
   * @returns {(CelestialBody|ContraptionBody)[]}
   */
  get interactableBodies() {
    return this.bodies.filter(body => {
      return body instanceof CelestialBody || body instanceof ContraptionBody
    })
  }
  
  /** Gets the next unique id for a body */
  getNextBodyID() {
    return this.nextBodyID++; // return the value, then increment it
  }
  
  /** Gets the next unique id for a component */
  getNextComponentID() {
    return this.nextComponentID++; // return the value, then increment it
  }

  /**
   * Gets the character body of a player by their uuid, or creates a new one if none is found. <br>
   * If there is only one player in a world, the uuid is ignored (for shared singleplayer worlds)
   * @param {string} uuid
   * @returns {CharacterBody}
   */
  getPlayersCharacterBody(uuid) {
    

    /* TODO: this needs to not happen when loading the 2nd ever player in multiplayer
    // otherwise if there's just one character, change it's uuid and return it
    let characterBodies = this.bodies.filter(body => body.type === "voxilon:character_body")
    if(characterBodies.length === 1) {
      characterBody = characterBodies[0]
      console.info(`Changing UUID of singleplayer body from ${characterBody.player_uuid} to ${uuid}`)
      characterBody.player_uuid = uuid
      return characterBody
    }*/

  }

  /**
   * Loads a Body's serialized form and adds it to the world
   * @param {Object} data           The serialized data
   * @param {boolean} [addToWorld]  Should the body be added to the world, default true. If false, just deserializes the body and returns it
   * @returns {Body}                The loaded body
   */
  loadBody(data, addToWorld = true) {
    const body = new constructors[data.type](data, this)

    if(addToWorld) {
      this.addBody(body)
    }

    return body
  }

  getAllBodiesByType(type) {
    return this.bodies.filter(b => b.type === type)
  }

  /**
   * Removes a body from the world, such that is is no longer visible, interactable, or is updated. Does not destroy the object itself.
   * @param {Body} body
   */
  removeBody(body) {
    const index = this.bodies.indexOf(body)
    if(index === -1) {
      console.error(`given body is not in world:`, body)
      throw new Error(`given body is not in world!`)
    }
    this.physics.removeBody(body.rigidBody)
    if(body.mesh) this.scene.remove(body.mesh)
    this.bodies.splice(index, 1)
  }
  /**
   * Adds a body to the world that has already been loaded by {@link World#loadBody}.
   * @param {Body} body
   */
  addBody(body) {
    this.physics.addBody(body.rigidBody)
    if(body.mesh) this.scene.add(body.mesh)
    this.bodies.push(body)

    body.netPriority = 0
    this.netSyncQueue.push(body)
  }

  getBodyByID(id) {
    const body = this.bodies.find(body => body.id === id)
    if(!body) {
      throw new Error(`body with an id of '${id}' not found!`)
    }
    return body
  }

  preRender() {
    // updates THREE meshes
    for(const body of this.bodies) {
      body.preRender()
    }
  }

  step() {
    // calculates gravity & updates bodies' additional behavior (i.e. contraptions' components)
    for(const body of this.bodies) {
      body.update()
      body.postUpdate()
    }

    this.physics.fixedStep(DT)
  }
}
