import Component from 'engine/Component.js'

import { check } from 'engine/util.js'


/**
 * Represents a network of components connected via Networking Cable.  \
 * 'neighbor' networks connected via Connectors/Wireless modems are seperate Network objects
 */
export default class Network {
  /** @type {Object} */
  #hostnameIndexes
  /** @type {Map<string,Component} */
  #components

  constructor(data) {
    this.#hostnameIndexes = check(data.hostnameIndexes, "object?") ?? {}
    this.#components = new Map()
  }

  serialize() {
    return {
      hostnameIndexes: this.#hostnameIndexes
    }
  }

  /**
   * Generates the next automatic hostname for the given prefix
   * @param {string} hostnamePrefix
   * @returns {string}
   */
  nextHostname(hostnamePrefix) {
    if(typeof hostnamePrefix !== "string") {
      throw new TypeError(`hostnamePrefix must be a string, got ${typeof hostnamePrefix}`)
    }

    const index = this.#hostnameIndexes[hostnamePrefix]
    if(index) {
      this.#hostnameIndexes[hostnamePrefix] = index + 1
      return hostnamePrefix + "_" + index
    } else {
      this.#hostnameIndexes[hostnamePrefix] = 1
      return hostnamePrefix + "_0"
    }
  }

  /**
   * Adds a component to the network
   * @param {string} hostname
   * @param {Component} component
   */
  addComponent(hostname, component) {
    this.#components.set(hostname, component)
  }

  /**
   * Gets a component by it's hostname
   * @param {string} hostname
   * @returns {Component}
   */
  getComponent(hostname) {
    const c = this.#components.get(hostname)
    if(!c) {
      throw new Error(`No component found with hostname ${hostname}`)
    }
    return c
  }
  
  /**
   * Gets a list of compnents by their type
   * @param {string} type
   * @returns {Component[]}
   */
  getComponents(type) {
    const matches = []
    for (const [key, value] of this.#components) {
      if(value.type === type) {
        matches.push(value)
      }
    }
    return matches
  }
}
