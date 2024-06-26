import Network from 'engine/Network.js'
import Component from 'engine/Component.js'
import { check } from 'engine/util.js'

/**
 * Subclass for components that connect to a contraption's network  \
 * NOT related to game/internet networking
 */
export default class NetworkedComponent extends Component {
  /** @type {string} */
  hostname
  /** @type {Network} */
  network

  constructor(data, world, shape, mesh) {
    super(data, world, shape, mesh)

    this.hostname = check(data.hostname, "string?")
  }

  serialize() {
    const data = super.serialize()
    data.hostname = this.hostname
    return data
  }

  /**
   * Serializes this component's network data
   * @returns {Object}
   */
  serializeNetwork() {
    throw new Error(`serializeNetwork not implemented for ${this.type}`)
  }

  /**
   * Parses the network data and reconstructs runtime references to other components
   * @param {Object} networkData
   */
  reviveNetwork(networkData) {
    throw new Error(`reviveNetwork not implemented for ${this.type}`)
  }

  /**
   * Connects this networked component to the given Network
   * @param {Network} network
   */
  connectToNetwork(network) {
    this.network = network

    console.log("connecting", this, "to network", network, ", has hostname: " + this.hostname)

    if(!this.hostname) { // generate hostname if needed
      this.hostname = network.nextHostname(this.constructor.hostnamePrefix)
      console.log("generated hostname: " + this.hostname)
    }

    network.addComponent(this.hostname, this)
  }
}
