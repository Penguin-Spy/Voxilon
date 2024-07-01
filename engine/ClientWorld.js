/** @typedef {import('link/Link.js').default} Link */
/** @typedef {import('engine/client/AbstractClientBody.js').default} AbstractClientBody */
/** @typedef {import('engine/client/AbstractClientComponent.js').default} AbstractClientComponent */

import * as THREE from 'three'
import * as CANNON from 'cannon-es'

import CelestialClientBody from 'engine/client/CelestialClientBody.js'
import TestClientBody from 'engine/client/TestClientBody.js'
import CharacterClientBody from 'engine/client/CharacterClientBody.js'
import { DT } from 'engine/util.js'
import { contactMaterials } from 'engine/PhysicsMaterials.js'

const WORLD_VERSION = "alpha_1" // just the data version

const constructors = {
  "voxilon:celestial_body": CelestialClientBody,
  "voxilon:character_body": CharacterClientBody,
  "voxilon:test_body": TestClientBody,
  "voxilon:contraption_body": () => { throw new TypeError("contraption_body not implemented") }
}


/**
 * @typedef IClientWorld
 * @property {THREE.Scene} scene
 * @property {CANNON.World} physics
 * @property {AbstractClientBody[]} buildableBodies
 * @property {AbstractClientBody[]} interactableBodies
 * @property {function} preRender
 */

/**
 * @class
 * @implements {IClientWorld}
 * */
export default class ClientWorld {
  /** @type {Map<number, AbstractClientBody>} Contains all loaded bodies, mapped from body ID to Body object */
  #bodiesMap
  /** @type {Map<number, AbstractClientComponent>} Contains all loaded components, mapped from component ID to Component object */
  #componentsMap
  /** @type {AbstractClientBody[]} @protected Just the currently active bodies */
  activeBodies
  /** @type {AbstractClientBody[]} @readonly Just bodies that have gravitational influence */
  gravityBodies
  /** @type {AbstractClientBody[]} @readonly Just bodies that can be raycast through for building/interaction */
  buildableBodies
  /** @type {AbstractClientBody[]} @readonly */ interactableBodies
  /** @type {Link} */
  #link

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

    // --- THREE ---
    this.scene = new THREE.Scene()

    this.#bodiesMap = new Map()
    this.#componentsMap = new Map()
    this.activeBodies = []

    this.gravityBodies = []
    this.buildableBodies = []
    this.interactableBodies = this.buildableBodies
  }

  load(data) {
    if(data.VERSION !== WORLD_VERSION) throw new Error(`Unknown world version: ${data.VERSION}`)
    this.name = data.name ?? "A Universe"

    // load bodies
    data.bodies.forEach(b => this.loadBody(b))

    //this.spawn_point = new THREE.Vector3(...data.spawn_point)
    this.spawn_point = data.spawn_point
  }

  /** Loads a Body's serialized form and adds it to the world. Newly-loaded bodies are active by default.
   * @param {Object} data           The serialized data
   * @returns {AbstractClientBody}                The loaded body
   */
  loadBody(data) {
    /** @type {AbstractClientBody} */
    const body = new constructors[data.type](data, this)
    this.#bodiesMap.set(body.id, body)
    this.activateBody(body)
    return body
  }
  /** Marks a body as active (participates in ticking, rendering, and physics). Newly-loaded bodies are active by default.
   * @param {AbstractClientBody} body
   */
  activateBody(body) {
    this.physics.addBody(body.rigidBody)
    this.scene.add(body.mesh)
    this.activeBodies.push(body)

    if(body instanceof CelestialClientBody && body.rigidBody.mass > 0) {
      this.gravityBodies.push(body)
    }
    if(body instanceof CelestialClientBody /*|| body instanceof ContraptionBody*/) {
      this.interactableBodies.push(body)
    }
  }
  /** Marks a body as inactive, such that is is no longer visible, interactable, or is updated. The Body continues to be loaded and be accessable by references or its ID.
   * @param {AbstractClientBody} body
   */
  deactivateBody(body) {
    const index = this.activeBodies.indexOf(body)
    if(index === -1) {
      console.error(body)
      throw new TypeError(`given body is not active!`)
    }
    this.physics.removeBody(body.rigidBody)
    this.scene.remove(body.mesh)
    this.activeBodies.splice(index, 1)

    const gravityIndex = this.gravityBodies.indexOf(body)
    if(gravityIndex !== -1) this.gravityBodies.splice(gravityIndex, 1)
    const interactableIndex = this.interactableBodies.indexOf(body)
    if(interactableIndex !== -1) this.interactableBodies.splice(interactableIndex, 1)
  }

  /** Gets all bodies with the given type
   * @param {string} type
   */
  /*getAllBodiesByType(type) {
    const filteredBodies = []
    for(const body of this.#bodiesMap.values()) {
      if(body.type === type) filteredBodies.push(body)
    }
    return filteredBodies
  }*/

  /** Gets the body with the given ID
   * @param {number} id
   */
  getBodyByID(id) {
    return this.#bodiesMap.get(id)
  }

  /** @param {AbstractClientComponent} component */
  addComponent(component) {
    this.#componentsMap.set(component.id, component)
  }
  /** @param {number} id */
  getComponentByID(id) {
    return this.#componentsMap.get(id)
  }

  preRender() {
    // updates THREE meshes
    for(const body of this.activeBodies) {
      body.preRender()
    }
  }

  step() {
    // calculates & applies gravity
    for(const body of this.activeBodies) {
      body.step()
    }

    this.physics.fixedStep(DT)
  }
}
