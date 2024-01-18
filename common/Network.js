import { check } from "/common/util.js"


/**
 * Represents a network of components connected via Networking Cable.  \
 * 'neighbor' networks connected via Connectors/Wireless modems are seperate Network objects
 */
export default class Network {
  /** @type {Object} */
  #hostnameIndexes

  constructor(data) {
    this.#hostnameIndexes = check(data.hostnameIndexes, "object?") ?? {}
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
    if(!hostnamePrefix) {
      throw new Error(`hostnamePrefix cannot be undefined!`)
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
}
