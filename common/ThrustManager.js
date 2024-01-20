import Body from "/common/Body.js"
import Thruster from "/common/components/Thruster.js"
import NetworkedComponent from "/common/NetworkedComponent.js"

import * as THREE from 'three'
import { ComponentDirection } from "/common/components/componentUtil.js"


const _v = new THREE.Vector3()

const min = Math.min, max = Math.max

export default class ThrustManager {
  component
  /** @type {THREE.Vector3} the total available thrust in the +XYZ directions */
  #totalPositiveThrust
  /** @type {THREE.Vector3} the total available thrust in the -XYZ directions. note that all components are positive numbers */
  #totalNegativeThrust

  /**
   * @param {NetworkedComponent} component the parent component
   */
  constructor(component) {
    this.component = component

    this.inputState = {
      dampeners: true,
      front_back: 0,
      left_right: 0,
      up_down: 0
    }

    this.pxThrusters = []
    this.nxThrusters = []
    this.pyThrusters = []
    this.nyThrusters = []
    this.pzThrusters = []
    this.nzThrusters = []

    this.#totalPositiveThrust = new THREE.Vector3()
    this.#totalNegativeThrust = new THREE.Vector3()
  }

  serializeNetwork() {
    return {
      pxThrusters: this.pxThrusters.map(c => c.hostname),
      nxThrusters: this.nxThrusters.map(c => c.hostname),
      pyThrusters: this.pyThrusters.map(c => c.hostname),
      nyThrusters: this.nyThrusters.map(c => c.hostname),
      pzThrusters: this.pzThrusters.map(c => c.hostname),
      nzThrusters: this.nzThrusters.map(c => c.hostname),
    }
  }
  reviveNetwork(netData) {
    const network = this.component.network
    // get references to thrusters, or initalize to an empty array if no data exists
    netData.pxThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.nxThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.pyThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.nyThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.pzThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.nzThrusters?.map(h => this.addThruster(network.getComponent(h)))
  }

  /**
   * Sets the rigidbody this thrustmanager acts on
   * @param {Body} body
   */
  setBody(body) {
    this.body = body.rigidBody
  }

  setInputState(dampeners, front_back, left_right, up_down) {
    this.inputState.dampeners = dampeners
    this.inputState.front_back = front_back
    this.inputState.left_right = left_right
    this.inputState.up_down = up_down
  }

  /**
   * @param {Thruster} thruster  a thruster component for this manager to control
   */
  addThruster(thruster) {
    // determine direction of this thruster
    // TODO: do this relative to the direction of the ThrustManager's rotation? or not bc we actually want thrust relative to the contraption body's "front"
    const axis = ComponentDirection.getAxis(thruster.rotation)

    // add to list & add max thrust to #total[Positive/Negative]Thrust
    switch(axis) {
      case 0:
        this.pxThrusters.push(thruster)
        this.#totalPositiveThrust.x += thruster.maxThrust
        break;
      case 1:
        this.nxThrusters.push(thruster)
        this.#totalNegativeThrust.x += thruster.maxThrust
        break;
      case 2:
        this.pyThrusters.push(thruster)
        this.#totalPositiveThrust.y += thruster.maxThrust
        break;
      case 3:
        this.nyThrusters.push(thruster)
        this.#totalNegativeThrust.y += thruster.maxThrust
        break;
      case 4:
        this.pzThrusters.push(thruster)
        this.#totalPositiveThrust.z += thruster.maxThrust
        break;
      case 5:
        this.nzThrusters.push(thruster)
        this.#totalNegativeThrust.z += thruster.maxThrust
        break;
    }

  }

  // calculate output thrust necessary
  update() {
    const inputState = this.inputState
    // _v is thrust we want to apply
    _v.set(0, 0, 0)

    // IF DAMPENERS ENABLED
    //if(inputState.dampeners) {
    if(false) {
      const gravityVector = this.body.gravityVector

      // calculate thrust necessary to oppose gravity vector of body (TODO: share this with all thrust managers of the body?)
      // if we have all the thrust necessary in a direction, zero out that component of the gravity vector
      if(gravityVector.x > 0) {
        _v.x = min(gravityVector.x, this.#totalNegativeThrust.x)
        gravityVector.x = max(gravityVector.x - this.#totalNegativeThrust.x, 0)
      } else if(gravityVector.x < 0) {
        _v.x = max(gravityVector.x, this.#totalPositiveThrust.x)
        gravityVector.x = min(gravityVector.x - this.#totalPositiveThrust.x, 0)
      }

      // calculate thrust necessary to oppose current undesired movement
    }
    // END DAMPENERS IF

    // calculate thrust to be applied for accelerating
    if(inputState.front_back > 0) {
      _v.z = this.#totalPositiveThrust.z
    } else if(inputState.front_back < 0) {
      _v.z = -this.#totalNegativeThrust.z
    }
    if(inputState.left_right > 0) {
      _v.x = this.#totalPositiveThrust.x
    } else if(inputState.left_right < 0) {
      _v.x = -this.#totalNegativeThrust.x
    }
    if(inputState.up_down > 0) {
      _v.y = this.#totalPositiveThrust.y
    } else if(inputState.up_down < 0) {
      _v.y = -this.#totalNegativeThrust.y
    }

    // TODO: probably way easier (and better performance) to just multiply _v by the rigidBody's invMass and add to velocity directly
    // applyLocalImpulse does a lot of stuff that we don't need (it does handle sleeping bodies which we'll need later, but not rn)
    this.body.applyLocalImpulse(_v)
  }

}
