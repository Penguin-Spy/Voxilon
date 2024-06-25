/** @typedef {import('link/Player.js').default} Player */
/** @typedef {import('engine/AbstractComponent.js').component_data} component_data */

import AbstractComponent from 'engine/AbstractComponent.js'

export default class AbstractServerComponent extends AbstractComponent {
  /**
   * @param {component_data} data
   * @param {World} world
   * @param {CANNON.Shape} shape
   */
  constructor(data, world, shape) {
    super(data, world, shape)
  }

  reviveReferences() { }

  serialize() {
    const data = {}
    data.type = this.type
    data.id = this.id
    data.position = this.position.toArray()
    data.rotation = this.rotation
    return data
  }

  /** Receives a screen action triggered by a player
   * @param {Player} player The player who performed the action
   * @param {string} action The action
   * @param {object} data Data for the action
  */
  receiveScreenAction(player, action, data) {
    throw new TypeError(`receiveScreenAction not implemented for ${this.constructor.name}`)
  }

  /** Processes the player interacting with the component.
   * @param {Player} player     The player who interacted with the component
   * @param {boolean} alternate True if the 'alternate' interaction action should be taken (e.g. open gui instead of activating component)
   */
  interact(player, alternate) {
    // interacting does nothing by default; will be implemented by subclasses if necessary
  }

  /*
  update() { }
  */
}
