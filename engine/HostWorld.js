/** @typedef {import('engine/ClientWorld.js').IClientWorld} IClientWorld */
/** @typedef {import('engine/server/AbstractServerBody.js').default} AbstractServerBody */
/** @typedef {import('engine/client/AbstractClientBody.js').default} AbstractClientBody */
/** @typedef {import('engine/client/AbstractClientComponent.js').default} AbstractClientComponent */

import * as THREE from 'three'

import ServerWorld from 'engine/ServerWorld.js'

import CelestialClientBody from 'engine/client/CelestialClientBody.js'
import TestClientBody from 'engine/client/TestClientBody.js'
import CharacterClientBody from 'engine/client/CharacterClientBody.js'

const clientConstructors = {
  "voxilon:celestial_body": CelestialClientBody,
  "voxilon:character_body": CharacterClientBody,
  "voxilon:test_body": TestClientBody,
  "voxilon:contraption_body": () => { throw new TypeError("contraption_body not implemented") }
}

/** @implements {IClientWorld} */
export default class HostWorld extends ServerWorld {
  /** @type {Map<number, AbstractClientBody>} Contains all loaded bodies, mapped from body ID to Body object */
  #clientBodiesMap
  /** @type {Map<number, AbstractClientComponent>} Contains all loaded components, mapped from component ID to Component object */
  #clientComponentsMap
  /** @type {AbstractClientBody[]} Just the currently active bodies */
  #activeClientBodies

  constructor(link) {
    super(link)

    // --- THREE ---
    this.scene = new THREE.Scene()

    this.#clientBodiesMap = new Map()
    this.#clientComponentsMap = new Map()
    this.#activeClientBodies = []

    this.buildableBodies = []
    this.interactableBodies = []
  }

  /** Loads a Body's serialized form and adds it to the world. Newly-loaded bodies are active by default.
   * @param {Object} data           The serialized data
   * @param {keyof typeof clientConstructors} data.type
   * @param {number} data.id
   * @returns {AbstractClientBody}                The loaded body
   */
  loadClientBody(data) {
    const body = new clientConstructors[data.type](data, this, this.getBodyByID(data.id).rigidBody)
    this.#clientBodiesMap.set(body.id, body)
    this.activateClientBody(body)
    return body
  }
  /** Marks a body as active (participates in ticking, rendering, and physics). Newly-loaded bodies are active by default.
   * @param {AbstractClientBody} body
   */
  activateClientBody(body) {
    this.#activeClientBodies.push(body)
    this.scene.add(body.mesh)
    /*if(body instanceof CelestialClientBody && body.rigidBody.mass > 0) {
      this.clientGravityBodies.push(body)
    }*/
    if(body instanceof CelestialClientBody /*|| body instanceof ContraptionBody*/) {
      this.interactableBodies.push(body)
    }
  }

  /** Marks a body as inactive, such that is is no longer visible, interactable, or is updated. The Body continues to be loaded and be accessable by references or its ID.
   * @param {AbstractClientBody} body
   */
  deactivateClientBody(body) {
    const index = this.#activeClientBodies.indexOf(body)
    if(index === -1) {
      console.error(body)
      throw new TypeError(`given client body is not active!`)
    }
    this.scene.remove(body.mesh)
    this.#activeClientBodies.splice(index, 1)
  }

  /** Gets the client body with the given ID
   * @param {number} id
   */
  getClientBodyByID(id) {
    return this.#clientBodiesMap.get(id)
  }

  preRender() {
    // updates THREE meshes
    for(const body of this.#activeClientBodies) {
      body.preRender()
    }
  }

}
