import Component from "/common/Component.js"
import Body from "/common/Body.js"

import * as THREE from 'three'
import { ComponentDirection } from '/common/components/componentUtil.js'
import { check } from '/common/util.js'
import constructors from '/common/components/index.js'

const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()

/**
 * Represents a single contraption in any form (attached to a celestial body, or free-floating)
 */
export default class Contraption {
  #parent;
  /** @type {THREE.Vector3} */
  positionOffset;
  /** @type {THREE.Quaternion} */
  quaternionOffset;

  /**
   * @param {object}  data      data for the contraption
   * @param {Body}    parent    parent body of the contraption (ContraptionBody or CelestialBody)
   */
  constructor(data, parent) {
    const components_data = check(data.components, "object[]")

    data = {
      positionOffset: [0, 0, 0],
      quaternionOffset: [0, 0, 0, 1],
      ...data,
    }

    const components = []
    Object.defineProperties(this, {
      // read-only properties
      positionOffset: { enumerable: true, value: new THREE.Vector3() },
      quaternionOffset: { enumerable: true, value: new THREE.Quaternion() },
      components: { enumerable: true, value: components }
    })

    this.#parent = parent
    this.positionOffset.set(...data.positionOffset)
    this.quaternionOffset.set(...data.quaternionOffset)

    // load components
    components_data.forEach(c => this.loadComponent(c))
  }

  serialize() {
    return {
      positionOffset: this.positionOffset.toArray(),
      quaternionOffset: this.quaternionOffset.toArray(),
      components: this.components.map(c => c.serialize())
    }
  }

  /**
   * Transforms a contraption-space position to it's world-space position
   * @param {THREE.Vector3} v  the position; modified in-place
   */
  toWorldPosition(v) {
    v.add(this.positionOffset)
    v.applyQuaternion(this.getOriginWorldQuaternion())
    v.add(this.#parent.position)
  }
  /**
   * Gets the world-space quaternion of this contraption
   */
  getOriginWorldQuaternion() {
    const q = new THREE.Quaternion();
    q.copy(this.#parent.quaternion)
    q.multiply(this.quaternionOffset)
    return q
  }

  /**
   * Loads a Component's serialized form and adds it to the Contraption
   * @param data The serialized data
   */
  loadComponent(data) {
    /** @type {Component} */
    const component = new constructors[data.type](data)

    // calculate position offset from origin (center) of parent rigidBody
    _v.copy(component.position).add(component.offset).add(this.positionOffset)
    _v.applyQuaternion(this.quaternionOffset)
    // calculate quaternion offset from parent rigidBody
    _q.copy(this.quaternionOffset)
    ComponentDirection.rotateQuaternion(_q, component.rotation)

    // add shape to rigidbody
    this.#parent.rigidBody.addShape(component.shape, _v, _q)
    // add mesh to parent mesh
    component.mesh.position.copy(_v)
    component.mesh.quaternion.copy(_q)
    this.#parent.mesh.add(component.mesh)

    // store references
    this.components.push(component)
    component.parentContraption = this
    return component
  }

  update(world, DT) {
    this.components.forEach(c => c.update(world, DT))
  }
}
