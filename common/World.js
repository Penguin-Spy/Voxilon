import * as CANNON from 'cannon'
import * as THREE from 'three'
import CelestialBody from "/common/bodies/CelestialBody.js"
import CharacterBody from "./bodies/CharacterBody.js"
import TestBody from "/common/bodies/TestBody.js"
import ContraptionBody from '/common/bodies/ContraptionBody.js'
import { contactMaterials } from "/common/PhysicsMaterials.js"

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

    // load bodies
    data.bodies.forEach(b => this.loadBody(b))

    this.spawn_point = new THREE.Vector3(...data.spawn_point)
  }

  serialize(noBodies = false) {
    const data = { "VERSION": WORLD_VERSION }
    data.name = this.name
    data.spawn_point = this.spawn_point.toArray()
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
   * an array of all bodies that can be interacted with. used for interaction raycasting
   * @returns {(CelestialBody|ContraptionBody)[]}
   */
  get interactableBodies() {
    return this.bodies.filter(body => {
      return body instanceof CelestialBody || body instanceof ContraptionBody
    })
  }

  /**
   * Gets the character body of a player by their uuid, or creates a new one if none is found. <br>
   * If there is only one player in a world, the uuid is ignored (for shared singleplayer worlds)
   * @param {string} uuid
   * @returns {CharacterBody}
   */
  getPlayersCharacterBody(uuid) {
    // first try to find a character with matching uuid
    /** @type {CharacterBody} */
    let characterBody = this.bodies.find(body => body.player_uuid === uuid)
    if(characterBody) return characterBody

    // otherwise if there's just one character, change it's uuid and return it
    let characterBodies = this.bodies.filter(body => body.type === "voxilon:character_body")
    if(characterBodies.length === 1) {
      characterBody = characterBodies[0]
      console.info(`Changing UUID of singleplayer body from ${characterBody.player_uuid} to ${uuid}`)
      characterBody.player_uuid = uuid
      return characterBody
    }

    // otherwise there's multiple players and this player doesn't have one, create a new one
    console.log(`Spawning in new character for player ${uuid}`)
    characterBody = this.loadBody({
      type: "voxilon:character_body",
      position: this.spawn_point.toArray(),
      player_uuid: uuid
    })
    return characterBody
  }

  /**
   * Loads a Body's serialized form and adds it to the world
   * @param data      The serialized data
   * @returns {Body}  The loaded body
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

  step() {
    // calculates gravity & updates bodies' additional behavior (i.e. contraptions' components)
    for(const body of this.bodies) {
      body.update()
    }

    this.physics.fixedStep(DT)
  }
}
