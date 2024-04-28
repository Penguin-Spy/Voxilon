import Body from 'engine/Body.js'
import Component from 'engine/Component.js'

import * as CANNON from 'cannon-es'
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
  /** @type {Map<number, Body>} Contains all loaded bodies, mapped from body ID to Body object */
  #bodiesMap
  /** @type {Map<number, Component>} Contains all loaded components, mapped from component ID to Component object */
  #componentsMap
  /** @type {Body[]} @protected Just the currently active bodies */
  activeBodies
  /** @type {Body[]} @readonly Just bodies that have gravitational influence */
  gravityBodies
  /** @type {Body[]} @readonly Just bodies that can be raycast through for building/interaction */
  buildableBodies
  /** @type {Body[]} @readonly */ interactableBodies

  constructor(data) {
    if(data.VERSION !== WORLD_VERSION) throw new Error(`Unknown world version: ${data.VERSION}`)

    this.name = data.name ?? "A Universe"

    // --- CANNON ---
    this.physics = new CANNON.World({
      frictionGravity: new CANNON.Vec3(0, -9.82, 0) // direction doesn't matter, only magnitude is used in friction calculations
    })
    for(const contactMaterial of contactMaterials) {
      this.physics.addContactMaterial(contactMaterial)
    }
    this.orbitalGravityEnabled = true

    // --- THREE ---
    this.scene = new THREE.Scene()

    this.#bodiesMap = new Map()
    this.#componentsMap = new Map()
    this.activeBodies = []

    this.gravityBodies = []
    this.buildableBodies = []
    this.interactableBodies = this.buildableBodies

    this.isServer = false

    // this is networking-related but it has to happen before loading the bodies
    // TODO: figure out how to put these in the ServerWorld
    // oh also the next ids need to be serialized
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
    data.bodies = []
    for(const b of this.#bodiesMap.values()) {
      data.bodies.push(b.serialize())
    }
    return data
  }

  /** Loads a Body's serialized form and adds it to the world. Newly-loaded bodies are active by default.
   * @param {Object} data           The serialized data
   * @returns {Body}                The loaded body
   */
  loadBody(data) {
    /** @type {Body} */
    const body = new constructors[data.type](data, this)
    this.#bodiesMap.set(body.id, body)
    this.activateBody(body)
    return body
  }
  /** Marks a body as active (participates in ticking, rendering, and physics). Newly-loaded bodies are active by default.
   * @param {Body} body
   */
  activateBody(body) {
    this.physics.addBody(body.rigidBody)
    if(body.mesh) this.scene.add(body.mesh)
    this.activeBodies.push(body)

    if(body instanceof CelestialBody && body.rigidBody.mass > 0) {
      this.gravityBodies.push(body)
    }
    if(body instanceof CelestialBody || body instanceof ContraptionBody) {
      this.interactableBodies.push(body)
    }
  }
  /** Marks a body as inactive, such that is is no longer visible, interactable, or is updated. The Body continues to be loaded and be accessable by references or its ID.
   * @param {Body} body
   */
  deactivateBody(body) {
    const index = this.activeBodies.indexOf(body)
    if(index === -1) {
      console.error(body)
      throw new TypeError(`given body is not active!`)
    }
    this.physics.removeBody(body.rigidBody)
    if(body.mesh) this.scene.remove(body.mesh)
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

  /** @param {Component} component */
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
    // calculates gravity & updates bodies' additional behavior (i.e. contraptions' components)
    for(const body of this.activeBodies) {
      body.update()
      body.postUpdate()
    }

    this.physics.fixedStep(DT)
  }
}
