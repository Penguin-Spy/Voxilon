//** @typedef {import('engine/Contraption.js').default} Contraption */

// TODO: Vector3 stuff
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { check } from 'engine/util.js'
import { ComponentDirection, rotateBoundingBox } from 'engine/componentUtil.js'

/**
 * @typedef {object} component_data
 * @property {number?} id
 * @property {[number,number,number]} position
 * @property {ComponentDirection} rotation
 */

/**
 * Base class for all components
 */
export default class Component {
  /** @type {THREE.Mesh} */
  mesh = null
  /** @type {CANNON.Shape} */
  shape = null
  /** @type {THREE.Vector3} */
  position
  /** @type {ComponentDirection} */
  rotation
  /** @type {string} */
  type
  /** @type {string} */
  static type
  /** @type {number} constant mass in kg (affects center of mass of contraption)*/
  mass
  /** @type {number} constant mass in kg (affects center of mass of contraption)*/
  static mass

  /** @type {Contraption} */
  parentContraption = null

  /**
   * @param {component_data} data
   * @param {World} world
   * @param {CANNON.Shape} shape
   */
  constructor(data, world, shape) {
    //const data_position = check(data.position, "number[]")
    //const rotation = check(data.rotation, "number")

    data = { // default values
      position: [0, 0, 0],
      rotation: 0,
      ...data // then overwrite with existing data values
    }

    this.world = world
    const id = data.id ?? world.getNextComponentID() // generate a new component id if necessary

    this.id = id
    this.shape = shape
    this.position = new THREE.Vector3()
    this.rotation = data.rotation
    // @ts-ignore  vscode doesn't understand static class properties
    this.type = this.constructor.type
    // @ts-ignore
    this.type = this.constructor.mass

    this.position.set(...data.position)

    // calculate rotated bounding box & offset
    /** @type {THREE.Vector3} */
    this.offset = this.constructor.offset.clone()
    /** @type {THREE.Box3} */
    this.boundingBox = this.constructor.boundingBox.clone()

    rotateBoundingBox(this.boundingBox.min, this.boundingBox.max, this.offset, this.rotation)
  }

  // TODO: can this just be replaced with passing the contraption in the constructor?
  /** Sets the parent contraption for this component
   * @param {Contraption} contraption
   */
  setParent(contraption) {
    this.parentContraption = contraption
  }
}
