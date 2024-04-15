import Body from 'engine/Body.js'
import NetworkedComponent from 'engine/NetworkedComponent.js'

import * as THREE from 'three'
import { check, DT } from 'engine/util.js'

const _twist = new THREE.Vector3()
const _angularVelocity = new THREE.Vector3()
const _worldToLocalQuaternion = new THREE.Quaternion()

const min = Math.min, max = Math.max, abs = Math.abs, sign = Math.sign

/**
 * Manages recieving input and applying torque on a contraption via its gyroscopes
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
    _worldToLocalQuaternion.copy(this.#rigidBody.quaternion).conjugate()

    // twist (angular impulse)
    // x: pitch (+up), y: yaw (+left), z: roll (+left)
    _twist.set(0, 0, 0)

    // current angular velocity to local refence frame
    _angularVelocity.copy(this.#rigidBody.angularVelocity).applyQuaternion(_worldToLocalQuaternion).multiply(this.#rigidBody.inertia).multiplyScalar(60)

    if(this.#pitch > 0) {
      _twist.x = this.#totalTorque.x * this.#torqueSensitivity
    } else if(this.#pitch < 0) {
      _twist.x = -this.#totalTorque.x * this.#torqueSensitivity
    }
    if(this.#yaw > 0) {
      _twist.y = this.#totalTorque.y * this.#torqueSensitivity
    } else if(this.#yaw < 0) {
      _twist.y = -this.#totalTorque.y * this.#torqueSensitivity
    }
    if(this.#roll > 0) {
      _twist.z = -this.#totalTorque.z * this.#torqueSensitivity
    } else if(this.#roll < 0) {
      _twist.z = this.#totalTorque.z * this.#torqueSensitivity
    }

    if(this.#dampeners) {
      const dampPitch = min(this.#totalTorque.x, abs(_angularVelocity.x)) * -sign(_angularVelocity.x)
      if(_twist.x > 0) { // set to the max of input & damp if in same dir, or just the input if not
        _twist.x = max(_twist.x, dampPitch)
      } else if(_twist.x < 0) {
        _twist.x = min(_twist.x, dampPitch)
      }
      const dampYaw = min(this.#totalTorque.y, abs(_angularVelocity.y)) * -sign(_angularVelocity.y)
      if(_twist.y > 0) {
        _twist.y = max(_twist.y, dampYaw)
      } else if(_twist.y < 0) {
        _twist.y = min(_twist.y, dampYaw)
      } else {
        _twist.y = dampYaw
      }
      const dampRoll = min(this.#totalTorque.z, abs(_angularVelocity.z)) * -sign(_angularVelocity.z)
      if(_twist.z > 0) {
        _twist.z = max(_twist.z, dampRoll)
      } else if(_twist.z < 0) {
        _twist.z = min(_twist.z, dampRoll)
      } else {
        _twist.z = dampRoll
      }
    }

    // save output torque first before we modify twist for applying to the rigid body
    this.outputTorque.copy(_twist)

    // convert twist to world frame and apply as torque
    _twist.multiply(this.#rigidBody.invInertia).multiplyScalar(DT)
    _twist.applyQuaternion(this.#rigidBody.quaternion)
    this.#rigidBody.angularVelocity.vadd(_twist, this.#rigidBody.angularVelocity)
  }
}
