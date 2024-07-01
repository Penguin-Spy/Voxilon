/** @typedef {import('link/Link.js').default} Link */
/** @typedef {import('engine/server/AbstractServerBody.js').default} AbstractServerBody */
/** @typedef {import('engine/server/AbstractServerComponent.js').default} AbstractServerComponent */

import * as THREE from 'three'
import * as CANNON from 'cannon-es'

import CelestialServerBody from 'engine/server/CelestialServerBody.js'
import TestServerBody from 'engine/server/TestServerBody.js'
import CharacterServerBody from 'engine/server/CharacterServerBody.js'
import { CircularQueue, DT } from 'engine/util.js'
import { contactMaterials } from 'engine/PhysicsMaterials.js'

const WORLD_VERSION = "alpha_1" // just the data version

const constructors = {
  "voxilon:celestial_body": CelestialServerBody,
  "voxilon:character_body": CharacterServerBody,
  "voxilon:test_body": TestServerBody,
  "voxilon:contraption_body": () => { throw new TypeError("contraption_body not implemented") }
}

export default class ServerWorld {
  /** @type {Map<number, AbstractServerBody>} Contains all loaded bodies, mapped from body ID to Body object */
  #bodiesMap
  /** @type {Map<number, AbstractServerComponent>} Contains all loaded components, mapped from component ID to Component object */
  #componentsMap
  /** @type {AbstractServerBody[]} @protected Just the currently active bodies */
  activeBodies
  /** @type {AbstractServerBody[]} @readonly Just bodies that have gravitational influence */
  gravityBodies
  /** @type {AbstractServerBody[]} @readonly Just bodies that can be raycast through for building/interaction */
  buildableBodies
  /** @type {AbstractServerBody[]} @readonly */ interactableBodies
  /** @type {Link} */
  #link

  #nextBodyID; #nextComponentID;

  /**
   * @param {Link} link
   */
  constructor(link) {
    this.#link = link

    // --- CANNON ---
    this.physics = new CANNON.World({
      frictionGravity: new CANNON.Vec3(0, -9.82, 0) // direction doesn't matter, only magnitude is used in friction calculations
    })
    for(const contactMaterial of contactMaterials) {
      this.physics.addContactMaterial(contactMaterial)
    }

    this.#bodiesMap = new Map()
    this.#componentsMap = new Map()
    this.activeBodies = []

    this.gravityBodies = []

    // oh also the next ids need to be serialized
    this.#nextBodyID = 0 // unique across all bodies
    this.#nextComponentID = 0 // unique across all components
    this.netSyncQueue = new CircularQueue()
  }

  load(data) {
    if(data.VERSION !== WORLD_VERSION) throw new Error(`Unknown world version: ${data.VERSION}`)
    this.name = data.name ?? "A Universe"

    // load bodies
    data.bodies.forEach(b => this.loadBody(b))

    // TODO: Vector3 stuff
    this.spawn_point = new THREE.Vector3(...data.spawn_point)
  }

  serialize() {
    const data = { "VERSION": WORLD_VERSION }
    data.name = this.name
    data.spawn_point = this.spawn_point.toArray()
    data.bodies = []
    for(const b of this.#bodiesMap.values()) {
      data.bodies.push(b.serialize())
    }
    return data
  }

  /** Loads a Body's serialized form and adds it to the world. Newly-loaded bodies are active by default.
   * @param {Object} data           The serialized data
   * @returns {AbstractServerBody}                The loaded body
   */
  loadBody(data) {
    /** @type {AbstractServerBody} */
    const body = new constructors[data.type](data, this)
    this.#bodiesMap.set(body.id, body)
    this.activateBody(body)
    this.#link.sendLoadBody(body)
    return body
  }
  /** Marks a body as active (participates in ticking, rendering, and physics). Newly-loaded bodies are active by default.
   * @param {AbstractServerBody} body
   */
  activateBody(body) {
    this.physics.addBody(body.rigidBody)
    this.activeBodies.push(body)
    if(body instanceof CelestialServerBody && body.rigidBody.mass > 0) {
      this.gravityBodies.push(body)
    }
  }
  /** Marks a body as inactive, such that is is no longer visible, interactable, or is updated. The Body continues to be loaded and be accessable by references or its ID.
   * @param {AbstractServerBody} body
   */
  deactivateBody(body) {
    const index = this.activeBodies.indexOf(body)
    if(index === -1) {
      console.error(body)
      throw new TypeError(`given body is not active!`)
    }
    this.physics.removeBody(body.rigidBody)
    this.activeBodies.splice(index, 1)

    const gravityIndex = this.gravityBodies.indexOf(body)
    if(gravityIndex !== -1) this.gravityBodies.splice(gravityIndex, 1)
    const interactableIndex = this.interactableBodies.indexOf(body)
    if(interactableIndex !== -1) this.interactableBodies.splice(interactableIndex, 1)
  }

  /** Gets all bodies with the given type
   * @param {string} type
   */
  getAllBodiesByType(type) {
    const filteredBodies = []
    for(const body of this.#bodiesMap.values()) {
      if(body.type === type) filteredBodies.push(body)
    }
    return filteredBodies
  }

  /** Gets the body with the given ID
   * @param {number} id
   */
  getBodyByID(id) {
    return this.#bodiesMap.get(id)
  }

  /** @param {AbstractServerComponent} component */
  addComponent(component) {
    this.#componentsMap.set(component.id, component)
  }
  /** @param {number} id */
  getComponentByID(id) {
    return this.#componentsMap.get(id)
  }

  /** Gets the next unique id for a body */
  getNextBodyID() {
    return this.#nextBodyID++; // return the value, then increment it
  }

  /** Gets the next unique id for a component */
  getNextComponentID() {
    return this.#nextComponentID++; // return the value, then increment it
  }

  /** Joins a player to the world, spawing in a character body if they're new to the world. Returns the player's body
   * @param {Player} player
   * @returns {CharacterServerBody}
   */
  joinPlayer(player) {
    // first try to find a character with matching uuid
    /** @type {CharacterServerBody} */
    let characterBody = this.activeBodies.find(body => body.player_uuid === player.uuid)
    /*if(!characterBody) {
      // check character bodies in control seats too
      for(const contraptionBody of this.getAllBodiesByType("voxilon:contraption_body")) {
        for(const component of contraptionBody.contraption.components) {
          if(component.type === "voxilon:control_seat" && component.storedCharacterBody && component.storedCharacterBody.player_uuid === player.uuid) {
            characterBody = component.storedCharacterBody
          }
        }
      }
    }*/

    /* TODO: this needs to not happen when loading the 2nd ever player in multiplayer
    // otherwise if there's just one character, change it's uuid and return it
    let characterBodies = this.bodies.filter(body => body.type === "voxilon:character_body")
    if(characterBodies.length === 1) {
      characterBody = characterBodies[0]
      console.info(`Changing UUID of singleplayer body from ${characterBody.player_uuid} to ${uuid}`)
      characterBody.player_uuid = uuid
      return characterBody
    }*/

    if(!characterBody) {
      // if characterBody is undefined, a new one must be spawned
      console.log("Spawning in new character for player", player)
      characterBody = this.loadBody({
        type: "voxilon:character_body",
        position: this.spawn_point.toArray(),
        player_uuid: player.uuid
      })
    }

    return characterBody
  }

  step() {
    // calculates gravity & updates bodies' additional behavior (i.e. contraptions' components)
    for(const body of this.activeBodies) {
      body.update()
    }

    this.physics.fixedStep(DT)
  }
}
