import Body from "/common/Body.js"
import NetworkedComponent from "/common/NetworkedComponent.js"

import * as THREE from 'three'
import { check, DT } from "/common/util.js"

const _avaliableTorque = new THREE.Vector3()
const _twist = new THREE.Vector3()
const _angularVelocity = new THREE.Vector3()
const _worldToLocalQuaternion = new THREE.Quaternion()

const _v1 = new THREE.Vector3()

const abs = Math.abs, min = Math.min, max = Math.max

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

function clamp(value, min, max) {
  return max(min(value, max), min)
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

  #dampeners; #torqueSensitivity; #pitch; #yaw; #roll
  #gyroscopes

  /**
   * @param {NetworkedComponent} component the parent component
   */
  constructor(component) {
    this.#component = component

    /** toruqe this manager is requesting (and applying), in Newton-meters */
    this.outputTorque = new THREE.Vector3()

    // input state
    this.#dampeners = false
    this.#torqueSensitivity = 1

    this.#pitch = 0
    this.#yaw = 0
    this.#roll = 0

    // gyroscope data
    this.#gyroscopes = []

    this.#totalTorque = new THREE.Vector3()
  }

  serializeNetwork() {
    return {
      gyroscopes: this.#gyroscopes.map(c => c.hostname),
      torqueSensitivity: this.#torqueSensitivity
    }
  }
  reviveNetwork(netData) {
    const network = this.#component.network
    // get references to gyroscopes
    netData.gyroscopes?.map(h => this.addGyroscope(network.getComponent(h)))

    const torqueSensitivity = check(netData.torqueSensitivity, "number?")
    if(torqueSensitivity) {
      this.#torqueSensitivity = torqueSensitivity
    }
  }

  /**
   * Sets the rigidbody this gyromanager acts on
   * @param {Body} body
   */
  setBody(body) {
    this.#rigidBody = body.rigidBody
  }

  /**
   * Sets the state of the linear dampers.
   * @param {boolean} dampeners true if linear damping is enabled.
   */
  setDampeners(dampeners) {
    this.#dampeners = dampeners
  }
  /**
   * Sets the value of the torque sensitivity.
   * @param {number} torqueSensitivity  percentage (0-1) of available torque to use for directional controls.
   */
  setTorqueSensitivity(torqueSensitivity) {
    this.#torqueSensitivity = torqueSensitivity
  }
  /**
   * Sets the input state of this gyro manager.
   * @param {-1|0|1} pitch
   * @param {-1|0|1} yaw
   * @param {-1|0|1} roll
   */
  setInputState(pitch, yaw, roll) {
    this.#pitch = pitch
    this.#yaw = yaw
    this.#roll = roll
  }

  /**
   * @param {Gyroscope} gyroscope  a gyro component for this manager to control
   */
  addGyroscope(gyroscope) {
    this.#gyroscopes.push(gyroscope)
    this.#totalTorque.addScalar(gyroscope.maxTorque)
  }

  // calculate output torque necessary
  update() {
    _avaliableTorque.copy(this.#totalTorque).multiply(this.#rigidBody.invInertia).multiplyScalar(DT)

    _worldToLocalQuaternion.copy(this.#rigidBody.quaternion).conjugate()

    // twist (angular impulse)
    // x: pitch (+up), y: yaw (+left), z: roll (+left)
    _twist.set(0, 0, 0)

    // current angular velocity to local refence frame
    _angularVelocity.copy(this.#rigidBody.angularVelocity).applyQuaternion(_worldToLocalQuaternion)

    if(this.#pitch > 0) {
      _twist.x = _avaliableTorque.x * this.#torqueSensitivity
    } else if(this.#pitch < 0) {
      _twist.x = -_avaliableTorque.x * this.#torqueSensitivity
    } else if(this.#dampeners) {
      _twist.x = -_angularVelocity.x
    }
    if(this.#yaw > 0) {
      _twist.y = _avaliableTorque.y * this.#torqueSensitivity
    } else if(this.#yaw < 0) {
      _twist.y = -_avaliableTorque.y * this.#torqueSensitivity
    } else if(this.#dampeners) {
      _twist.y = -_angularVelocity.y
    }
    if(this.#roll > 0) {
      _twist.z = -_avaliableTorque.z * this.#torqueSensitivity
    } else if(this.#roll < 0) {
      _twist.z = _avaliableTorque.z * this.#torqueSensitivity
    } else if(this.#dampeners) {
      _twist.z = -_angularVelocity.z
    }
    _twist.clamp(_v1.copy(_avaliableTorque).negate(), _avaliableTorque)

    // save output torque first before we modify twist for applying to the rigid body
    this.outputTorque.copy(_twist).multiplyScalar(60).multiply(this.#rigidBody.inertia)

    // convert twist to world frame and apply as torque
    _twist.multiply(this.#rigidBody.invInertia)
    _twist.applyQuaternion(this.#rigidBody.quaternion)
    this.#rigidBody.angularVelocity.vadd(_twist, this.#rigidBody.angularVelocity)
  }
}
