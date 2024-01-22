import Body from "/common/Body.js"
import Thruster from "/common/components/Thruster.js"
import NetworkedComponent from "/common/NetworkedComponent.js"

import * as THREE from 'three'
import { check, DT } from "/common/util.js"
import { ComponentDirection } from "/common/components/componentUtil.js"


/** the player's desired change in velocity for the conptration (directional input & thrust sensitivity) */
const _desiredAcceleration = new THREE.Vector3()
/** the player's desired velocity for the contraption */
const _desiredVelocity = new THREE.Vector3()
/** the change in velocity that gravity will be causing */
const _gravityAcceleration = new THREE.Vector3()

/** the actual change in velocity that will be applied to the rigidbody */
const _effectiveAcceleration = new THREE.Vector3()
/** the amount of change in velocity that is being consumed from the thrusters */
const _logicalAcceleration = new THREE.Vector3()

/** the amount of acceleration currently available in the +XYZ directions */
const _availablePositiveAcceleration = new THREE.Vector3()
/** the amount of acceleration currently available in the -XYZ directions */
const _availableNegativeAcceleration = new THREE.Vector3()

/** necessary ideal acceleration to cancel gravity & achieve the desired acceleration */
const _idealAcceleration = new THREE.Vector3()
/** acceleration that is able to be applied to canceling gravity & achiving the desired acceleration */
const _actualAcceleration = new THREE.Vector3()

const _worldToLocalQuaternion = new THREE.Quaternion()


const min = Math.min, max = Math.max, sign = Math.sign

export default class ThrustManager {
  /** @type {NetworkedComponent} */
  #component
  /** @type {Body} */
  #body
  /** @type {CANNON.Body} */
  #rigidBody
  /** @type {THREE.Vector3} the total available thrust in the +XYZ directions */
  #totalPositiveThrust
  /** @type {THREE.Vector3} the total available thrust in the -XYZ directions. note that all components are negative values */
  #totalNegativeThrust

  #dampeners; #thrustSensitivity; #front_back; #left_right; #up_down
  #pxThrusters; #nxThrusters; #pyThrusters; #nyThrusters; #pzThrusters; #nzThrusters

  /**
   * @param {NetworkedComponent} component the parent component
   */
  constructor(component) {
    this.#component = component

    /** thrust this manager is requesting (and applying), in Newtons (kg*m/s²) */
    this.outputThrust = new THREE.Vector3()

    // input state
    this.#dampeners = false
    this.#thrustSensitivity = 1

    this.#front_back = 0
    this.#left_right = 0
    this.#up_down = 0

    // thruster data
    this.#pxThrusters = []
    this.#nxThrusters = []
    this.#pyThrusters = []
    this.#nyThrusters = []
    this.#pzThrusters = []
    this.#nzThrusters = []

    this.#totalPositiveThrust = new THREE.Vector3()
    this.#totalNegativeThrust = new THREE.Vector3()
  }

  serializeNetwork() {
    return {
      pxThrusters: this.#pxThrusters.map(c => c.hostname),
      nxThrusters: this.#nxThrusters.map(c => c.hostname),
      pyThrusters: this.#pyThrusters.map(c => c.hostname),
      nyThrusters: this.#nyThrusters.map(c => c.hostname),
      pzThrusters: this.#pzThrusters.map(c => c.hostname),
      nzThrusters: this.#nzThrusters.map(c => c.hostname),

      thrustSensitivity: this.#thrustSensitivity
    }
  }
  reviveNetwork(netData) {
    const network = this.#component.network
    // get references to thrusters if data exists
    netData.pxThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.nxThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.pyThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.nyThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.pzThrusters?.map(h => this.addThruster(network.getComponent(h)))
    netData.nzThrusters?.map(h => this.addThruster(network.getComponent(h)))

    const thrustSensitivity = check(netData.thrustSensitivity, "number?")
    if(thrustSensitivity) {
      this.#thrustSensitivity = thrustSensitivity
    }
  }

  /**
   * Sets the rigidbody this thrustmanager acts on
   * @param {Body} body
   */
  setBody(body) {
    this.#body = body
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
   * Sets the value of the thrust sensitivity.
   * @param {number} thrustSensitivity  percentage (0-1) of available thrust to use for directional controls.
   */
  setThrustSensitivity(thrustSensitivity) {
    this.#thrustSensitivity = thrustSensitivity
  }
  /**
   * Sets the input state of this thrust manager.
   * @param {-1|0|1} front_back
   * @param {-1|0|1} left_right
   * @param {-1|0|1} up_down
   */
  setInputState(front_back, left_right, up_down) {
    this.#front_back = front_back
    this.#left_right = left_right
    this.#up_down = up_down
  }

  /**
   * @param {Thruster} thruster  a thruster component for this manager to control
   */
  addThruster(thruster) {
    // determine direction of this thruster
    // TODO: do this relative to the direction of the ThrustManager's rotation? or not bc we actually want thrust relative to the contraption body's "front"
    const axis = ComponentDirection.getAxis(thruster.rotation)

    // add to list & add/subtract max thrust to #total[Positive/Negative]Thrust
    // note that this is the direction the contraption would move with that thrust (opposite the direction the thruster is facing)
    switch(axis) {
      case 0:
        this.#pxThrusters.push(thruster)
        this.#totalPositiveThrust.x += thruster.maxThrust
        break;
      case 1:
        this.#nxThrusters.push(thruster)
        this.#totalNegativeThrust.x -= thruster.maxThrust
        break;
      case 2:
        this.#pyThrusters.push(thruster)
        this.#totalPositiveThrust.y += thruster.maxThrust
        break;
      case 3:
        this.#nyThrusters.push(thruster)
        this.#totalNegativeThrust.y -= thruster.maxThrust
        break;
      case 4:
        this.#pzThrusters.push(thruster)
        this.#totalPositiveThrust.z += thruster.maxThrust
        break;
      case 5:
        this.#nzThrusters.push(thruster)
        this.#totalNegativeThrust.z -= thruster.maxThrust
        break;
    }

  }

  // calculate output thrust necessary
  update() {
    _desiredVelocity.set(0, 0, 0) // TODO: get from cruse control setting

    // convert available thrust from Newtons (kg*m/s²) to change in velocity (m/s)
    _availablePositiveAcceleration.copy(this.#totalPositiveThrust).multiplyScalar(DT * this.#rigidBody.invMass)
    _availableNegativeAcceleration.copy(this.#totalNegativeThrust).multiplyScalar(DT * this.#rigidBody.invMass)

    // determine desired acceleration based on directional input & thrust sensitivity
    _desiredAcceleration.set(0, 0, 0)
    if(this.#front_back > 0) {
      _desiredAcceleration.z = _availablePositiveAcceleration.z * this.#thrustSensitivity
    } else if(this.#front_back < 0) {
      _desiredAcceleration.z = _availableNegativeAcceleration.z * this.#thrustSensitivity
    }
    if(this.#left_right > 0) {
      _desiredAcceleration.x = _availablePositiveAcceleration.x * this.#thrustSensitivity
    } else if(this.#left_right < 0) {
      _desiredAcceleration.x = _availableNegativeAcceleration.x * this.#thrustSensitivity
    }
    if(this.#up_down > 0) {
      _desiredAcceleration.y = _availablePositiveAcceleration.y * this.#thrustSensitivity
    } else if(this.#up_down < 0) {
      _desiredAcceleration.y = _availableNegativeAcceleration.y * this.#thrustSensitivity
    }

    // IF DAMPENERS
    if(this.#dampeners) {
      _worldToLocalQuaternion.copy(this.#rigidBody.quaternion).conjugate()

      // determine change in velocity necessary to counteract current velocity
      _desiredVelocity.sub(this.#rigidBody.velocity).applyQuaternion(_worldToLocalQuaternion)
      // add it to desired acceleration only where dampeners aren't used
      if(this.#front_back === 0) {
        _desiredAcceleration.z = _desiredVelocity.z
      }
      if(this.#left_right === 0) {
        _desiredAcceleration.x = _desiredVelocity.x
      }
      if(this.#up_down === 0) {
        _desiredAcceleration.y = _desiredVelocity.y
      }

      // determine actual (local) acceleration due to gravity from totalGravityVector. already in "change in velocity" form (m/s)
      _gravityAcceleration.copy(this.#body.totalGravityVector).applyQuaternion(_worldToLocalQuaternion)

      // --- do **math** to cancel out components of totalGravityVector that need to be canceled out ---

      // calculate the necessary ideal acceleration to cancel gravity & achieve the desired acceleration
      _idealAcceleration.subVectors(_desiredAcceleration, _gravityAcceleration)
      // clamp result for whichever direction it's in
      _idealAcceleration.clamp(_availableNegativeAcceleration, _availablePositiveAcceleration)
      // the result is how much acceleration we're technically doing with the thrusters
      _logicalAcceleration.copy(_idealAcceleration)

      // how much acceleration we can actually do to cancel gravity & achieve the desired acceleration
      _actualAcceleration.addVectors(_gravityAcceleration, _idealAcceleration)

      // if opposite sign of gravity, = effective thrust, zero gravity (was all canceled out)
      if(sign(_actualAcceleration.x) !== sign(_gravityAcceleration.x)) {
        _effectiveAcceleration.x = _actualAcceleration.x
        _gravityAcceleration.x = 0
      } else { // if same sign as gravity, = remaining gravity, zero effective thrust (was all used canceling gravity)
        _effectiveAcceleration.x = 0
        _gravityAcceleration.x = _actualAcceleration.x
      }
      if(sign(_actualAcceleration.y) !== sign(_gravityAcceleration.y)) {
        _effectiveAcceleration.y = _actualAcceleration.y
        _gravityAcceleration.y = 0
      } else {
        _effectiveAcceleration.y = 0
        _gravityAcceleration.y = _actualAcceleration.y
      }
      if(sign(_actualAcceleration.z) !== sign(_gravityAcceleration.z)) {
        _effectiveAcceleration.z = _actualAcceleration.z
        _gravityAcceleration.z = 0
      } else {
        _effectiveAcceleration.z = 0
        _gravityAcceleration.z = _actualAcceleration.z
      }

      // apply changes to gravity vector
      _gravityAcceleration.applyQuaternion(this.#rigidBody.quaternion)
      this.#body.totalGravityVector.copy(_gravityAcceleration)

    } else { // ELSE NOT DAMPENERS
      // set logical & effective acceleration to desired acceleration
      _logicalAcceleration.copy(_desiredAcceleration)
      _effectiveAcceleration.copy(_desiredAcceleration)
    }
    // END IF DAMPENERS

    // apply effective acceleration (CANNON.Body#applyLocalImpulse does a lot of stuff that we don't need (it does handle sleeping bodies which we'll need later, but not rn))
    _effectiveAcceleration.multiplyScalar(this.#rigidBody.invMass)
    _effectiveAcceleration.applyQuaternion(this.#rigidBody.quaternion)
    this.#rigidBody.velocity.vadd(_effectiveAcceleration, this.#rigidBody.velocity)

    // thrust this manager is requesting (and applying), in Newtons (kg*m/s²)
    this.outputThrust.copy(_logicalAcceleration).multiplyScalar(60 * this.#rigidBody.mass)
  }
}
