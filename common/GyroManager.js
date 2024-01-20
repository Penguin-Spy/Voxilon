import Body from "/common/Body.js"
import NetworkedComponent from "/common/NetworkedComponent.js"

import * as THREE from 'three'

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()

const abs = Math.abs

/**
 * Steps a value towards zero by `step`, does not overshoot. Returns the distance to zero
 * @param {number} value  the value to move towards zero
 * @param {number} step   how much to move it by
 * @returns {number}      the clamped distance to zero
 */
function toZeroStep(value, step) {
  if(abs(value) < step) {
    return -value
  } else if(value > 0) {
    return -step
  } else {
    return step
  }
}

/**
 * Manages recieving input and applying torque on a contraption via it's gyroscopes
 */
export default class GyroManager {
  /** @type {NetworkedComponent} */
  #component
  /** @type {CANNON.Body} */
  #rigidBody
  /** @type {THREE.Vector3} */
  #totalTorque

  /**
   * @param {NetworkedComponent} component the parent component
   */
  constructor(component) {
    this.#component = component

    this.inputState = {
      dampeners: true,
      pitch: 0,
      yaw: 0,
      roll: 0
    }

    this.gyroscopes = []

    this.#totalTorque = new THREE.Vector3()
  }

  serializeNetwork() {
    return {
      gyroscopes: this.gyroscopes.map(c => c.hostname),
    }
  }
  reviveNetwork(netData) {
    const network = this.#component.network
    // get references to gyroscopes
    netData.gyroscopes?.map(h => this.addGyroscope(network.getComponent(h)))
  }

  /**
   * Sets the rigidbody this gyromanager acts on
   * @param {Body} body
   */
  setBody(body) {
    this.#rigidBody = body.rigidBody
  }

  setInputState(dampeners, pitch, yaw, roll) {
    this.inputState.dampeners = dampeners
    this.inputState.pitch = pitch
    this.inputState.yaw = yaw
    this.inputState.roll = roll
  }

  /**
   * @param {Gyroscope} gyroscope  a gyro component for this manager to control
   */
  addGyroscope(gyroscope) {
    this.gyroscopes.push(gyroscope)
    this.#totalTorque.addScalar(gyroscope.maxTorque)
  }

  // calculate output torque necessary
  update(world, DT) {
    const dampeners = this.inputState.dampeners
    const pitch = this.inputState.pitch
    const roll = this.inputState.roll
    const yaw = this.inputState.yaw
    const torqueStrength = this.#totalTorque

    // twist (angular impulse)
    // x: pitch (+up), y: yaw (+left), z: roll (+left)
    _v1.set(0, 0, 0)

    // current angular velocity to local refence frame
    _v2.copy(this.#rigidBody.angularVelocity)
      .applyQuaternion(_q1.copy(this.#rigidBody.quaternion).conjugate())

    if(pitch > 0) {
      _v1.x = torqueStrength.x
    } else if(pitch < 0) {
      _v1.x = -torqueStrength.x
    } else if(dampeners) {
      _v1.x = toZeroStep(_v2.x, torqueStrength.z)
    }

    if(yaw > 0) {
      _v1.y = torqueStrength.y
    } else if(yaw < 0) {
      _v1.y = -torqueStrength.y
    } else if(dampeners) {
      _v1.y = toZeroStep(_v2.y, torqueStrength.y)
    }

    if(roll > 0) {
      _v1.z = -torqueStrength.z
    } else if(roll < 0) {
      _v1.z = torqueStrength.z
    } else if(dampeners) {
      _v1.z = toZeroStep(_v2.z, torqueStrength.z)
    }

    this.#rigidBody.vectorToWorldFrame(_v1, _v1)

    // apply twist appropriately according to the object's moment of inertia
    const e = this.#rigidBody.invInertiaWorld.elements
    this.#rigidBody.angularVelocity.x += e[0] * _v1.x + e[1] * _v1.y + e[2] * _v1.z
    this.#rigidBody.angularVelocity.y += e[3] * _v1.x + e[4] * _v1.y + e[5] * _v1.z
    this.#rigidBody.angularVelocity.z += e[6] * _v1.x + e[7] * _v1.y + e[8] * _v1.z
  }
}
