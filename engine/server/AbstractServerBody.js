/** @typedef {import('engine/ServerWorld.js').default} ServerWorld */

import AbstractBody from 'engine/AbstractBody.js'

export default class AbstractServerBody extends AbstractBody {
  /** @type {string} */
  type

  /**
   * @param {object} data
   * @param {ServerWorld} world
   * @param {CANNON.Body} rigidBody
   */
  constructor(data, world, rigidBody) {
    const id = data.id ?? world.getNextBodyID()
    super(data, world, rigidBody, id)
  }

  serialize() {
    const data = {}
    data.type = this.type
    data.id = this.id
    data.position = this.position.toArray()
    data.velocity = this.velocity.toArray()
    data.quaternion = this.quaternion.toArray()
    data.angularVelocity = this.angularVelocity.toArray()
    return data
  }

  // default implementation, may be replaced by subclasses
  update() {
    this.calculateGravity()
    this.applyGravity()
  }
}
