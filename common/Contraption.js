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
  quaternion;

  /**
   * @param {object}  data      data for the contraption
   * @param {Body}    parent    parent body of the contraption (ContraptionBody or CelestialBody)
   */
  constructor(data, parent) {
    const components_data = check(data.components, "object[]")

    data = {
      positionOffset: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      ...data,
    }

    /** @type {Component[]} */
    this.components = []
    Object.defineProperties(this, {
      // read-only properties
      positionOffset: { enumerable: true, value: new THREE.Vector3() },
      quaternion: { enumerable: true, value: new THREE.Quaternion() }
    })

    this.#parent = parent
    this.positionOffset.set(...data.positionOffset)
    this.quaternion.set(...data.quaternion)

    // load components
    components_data.forEach(c => this.loadComponent(c, false))
  }

  serialize() {
    return {
      positionOffset: this.positionOffset.toArray(),
      quaternion: this.quaternion.toArray(),
      components: this.components.map(c => c.serialize())
    }
  }

  /**
   * Transforms a contraption-space position to it's world-space position
   * @param {THREE.Vector3} v  the position; modified in-place
   */
  toWorldPosition(v) {
    v.applyQuaternion(this.quaternion)
    v.add(this.positionOffset)
    v.applyQuaternion(this.#parent.quaternion)
    v.add(this.#parent.position)
  }

  /**
   * Transforms a contraption-space quaterion to it's world-space quaterion
   * @param {THREE.Quaternion} q  the quaterion; modified in-place
   */
  toWorldQuaternion(q) {
    _q.copy(this.#parent.quaternion)
    _q.multiply(this.quaternion)
    q.premultiply(_q)
  }

  /**
   * Loads a Component's serialized form and adds it to the Contraption
   * @param {object}  data                    The serialized data
   * @param {boolean} [updateMassProperties]  should loading this component update the contraption's parent's mass properties; defaults to true
   *                                            if skipped, the parent's mass properties must be updated afterwards or it will behave weirdly
   */
  loadComponent(data, updateMassProperties = true) {
    /** @type {Component} */
    const component = new constructors[data.type](data)

    // calculate position offset from origin (center) of parent rigidBody
    _v.copy(component.position).add(component.offset)
    _v.applyQuaternion(this.quaternion)
    _v.add(this.positionOffset)

    // calculate quaternion of component
    _q.copy(this.quaternion)
    ComponentDirection.rotateQuaternion(_q, component.rotation)

    // add shape to rigidbody
    this.#parent.rigidBody.addShape(component.shape, _v, _q)
    // add mesh to parent mesh
    component.mesh.position.copy(_v)
    component.mesh.quaternion.copy(_q)
    this.#parent.mesh.add(component.mesh)

    // store references
    this.components.push(component)
    component.setParent(this)

    if(updateMassProperties) {
      this.#parent.updateMassProperties()
    }

    return component
  }

  update(world, DT) {
    this.components.forEach(c => c.update(world, DT))
  }
}
