import Body from "/common/Body.js"
import Thruster from "/common/components/Thruster.js"
import NetworkedComponent from "/common/NetworkedComponent.js"

import * as THREE from 'three'
import { DT } from "/common/util.js"
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

const _q1 = new THREE.Quaternion()

const _availablePositiveThrust = new THREE.Vector3()
const _availableNegativeThrust = new THREE.Vector3()

/*
const _v1 = new THREE.Vector3()

*/

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
  /** @type {THREE.Vector3} the total available thrust in the -XYZ directions. note that all components are positive numbers */
  #totalNegativeThrust

  #dampeners; #thrustSensitivity; #front_back; #left_right; #up_down

  /**
   * @param {NetworkedComponent} component the parent component
   */
  constructor(component) {
    this.#component = component

    this.#dampeners = false
    this.#thrustSensitivity = 1

    this.#front_back = 0
    this.#left_right = 0
    this.#up_down = 0

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
    const network = this.#component.network
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
    _desiredAcceleration.set(0, 0, 0)
    _desiredVelocity.set(0, 0, 0)

    // determine desired acceleration based on directional input & thrust sensitivity
    if(this.#front_back > 0) {
      _desiredAcceleration.z = this.#totalPositiveThrust.z
    } else if(this.#front_back < 0) {
      _desiredAcceleration.z = -this.#totalNegativeThrust.z
    }
    if(this.#left_right > 0) {
      _desiredAcceleration.x = this.#totalPositiveThrust.x
    } else if(this.#left_right < 0) {
      _desiredAcceleration.x = -this.#totalNegativeThrust.x
    }
    if(this.#up_down > 0) {
      _desiredAcceleration.y = this.#totalPositiveThrust.y
    } else if(this.#up_down < 0) {
      _desiredAcceleration.y = -this.#totalNegativeThrust.y
    }
    // convert from full thrust (Newtons, kg*m/s²) to desired change in velocity (m/s)
    _desiredAcceleration.multiplyScalar(this.#thrustSensitivity * DT * this.#rigidBody.invMass)

    _availablePositiveThrust.copy(this.#totalPositiveThrust).multiplyScalar(DT * this.#rigidBody.invMass)
    _availableNegativeThrust.copy(this.#totalNegativeThrust).multiplyScalar(DT * this.#rigidBody.invMass)

    // temp, don't need once dampeners code is done & always sets all 3 fields
    _effectiveAcceleration.set(0, 0, 0)


    // IF DAMPENERS
    if(this.#dampeners) {
      // determine actual (local) acceleration due to gravity from totalGravityVector. already in "change in velocity" form (m/s)
      _gravityAcceleration.copy(this.#body.totalGravityVector)
        .applyQuaternion(_q1.copy(this.#rigidBody.quaternion).conjugate())

      // do **math** to cancel out components of totalGravityVector that need to be canceled out
      {
        // calculate the necessary ideal acceleration to cancel gravity & achieve the desired acceleration
        let result = _desiredAcceleration.x - _gravityAcceleration.x
        // clamp result for whichever direction it's in
        if(sign(result) === 1) {
          result = min(result, _availablePositiveThrust.x)
        } else {
          result = max(result, -_availableNegativeThrust.x)
        }
        // the result is how much acceleration we're technically doing with the thrusters
        _logicalAcceleration.x = result

        let thing = _gravityAcceleration.x + result
        // if opposite sign of gravity, = effective thrust, zero gravity (was all canceled out)
        if(sign(thing) !== sign(_gravityAcceleration.x)) {
          _effectiveAcceleration.x = thing
          _gravityAcceleration.x = 0
        } else { // if same sign as gravity, = remaining gravity, zero effective thrust (was all used canceling gravity)
          _effectiveAcceleration.x = 0
          _gravityAcceleration.x = thing
        }
      }
      {
        // calculate the necessary ideal acceleration to cancel gravity & achieve the desired acceleration
        let result = _desiredAcceleration.y - _gravityAcceleration.y
        // clamp result for whichever direction it's in
        if(sign(result) === 1) {
          result = min(result, _availablePositiveThrust.y)
        } else {
          result = max(result, -_availableNegativeThrust.y)
        }
        // the result is how much acceleration we're technically doing with the thrusters
        _logicalAcceleration.y = result

        let thing = _gravityAcceleration.y + result
        // if opposite sign of gravity, = effective thrust, zero gravity (was all canceled out)
        if(sign(thing) !== sign(_gravityAcceleration.y)) {
          _effectiveAcceleration.y = thing
          _gravityAcceleration.y = 0
        } else { // if same sign as gravity, = remaining gravity, zero effective thrust (was all used canceling gravity)
          _effectiveAcceleration.y = 0
          _gravityAcceleration.y = thing
        }
      }
      {
        // calculate the necessary ideal acceleration to cancel gravity & achieve the desired acceleration
        let result = _desiredAcceleration.z - _gravityAcceleration.z
        // clamp result for whichever direction it's in
        if(sign(result) === 1) {
          result = min(result, _availablePositiveThrust.z)
        } else {
          result = max(result, -_availableNegativeThrust.z)
        }
        // the result is how much acceleration we're technically doing with the thrusters
        _logicalAcceleration.z = result

        let thing = _gravityAcceleration.z + result
        // if opposite sign of gravity, = effective thrust, zero gravity (was all canceled out)
        if(sign(thing) !== sign(_gravityAcceleration.z)) {
          _effectiveAcceleration.z = thing
          _gravityAcceleration.z = 0
        } else { // if same sign as gravity, = remaining gravity, zero effective thrust (was all used canceling gravity)
          _effectiveAcceleration.z = 0
          _gravityAcceleration.z = thing
        }
      }

      // apply changes to gravity vector
      _gravityAcceleration.applyQuaternion(this.#rigidBody.quaternion)
      this.#body.totalGravityVector.copy(_gravityAcceleration)

      // determine additional acceleration to apply to change actual velocity to desired velocity

    } else { // ELSE NOT DAMPENERS
      _logicalAcceleration.copy(_desiredAcceleration)
      _effectiveAcceleration.copy(_desiredAcceleration)
    }
    // else set logical & effective acceleration to desired acceleration
    // END IF DAMPENERS

    // apply effective acceleration
    //this.#rigidBody.velocity.vadd(_effectiveAcceleration, this.#rigidBody.velocity)
    this.#rigidBody.applyLocalImpulse(_effectiveAcceleration)

    this._logicalAcceleration = _logicalAcceleration


    // TODO: probably way easier (and better performance) to just multiply _v by the rigidBody's invMass and add to velocity directly
    // applyLocalImpulse does a lot of stuff that we don't need (it does handle sleeping bodies which we'll need later, but not rn)
    //this.#rigidBody.applyLocalImpulse(_v1)


    return


    const inputState = this.inputState

    // _v1 is thrust we want to apply
    _v1.set(0, 0, 0)



    // load total thrust into available thrust vectors
    _availablePositiveThrust.copy(this.#totalPositiveThrust).multiplyScalar(DT * this.#rigidBody.invMass)
    _availableNegativeThrust.copy(this.#totalNegativeThrust).multiplyScalar(DT * this.#rigidBody.invMass)

    // IF DAMPENERS ENABLED
    if(inputState.dampeners) {
      _gravityAcceleration.copy(this.#body.totalGravityVector)
        .applyQuaternion(_q1.copy(this.#rigidBody.quaternion).conjugate())

      // calculate thrust necessary to oppose gravity vector of body (TODO: share this with all thrust managers of the body?)
      // if we have all the thrust necessary in a direction, zero out that component of the gravity vector
      if(_gravityAcceleration.x > 0) {
        const thrust = min(_gravityAcceleration.x, _availableNegativeThrust.x)
        _gravityAcceleration.x = max(_gravityAcceleration.x - _availableNegativeThrust.x, 0)
        _availableNegativeThrust.x -= thrust
      } else if(_gravityAcceleration.x < 0) {
        const thrust = max(_gravityAcceleration.x, -_availablePositiveThrust.x)
        _gravityAcceleration.x = min(_gravityAcceleration.x + _availablePositiveThrust.x, 0)
        _availablePositiveThrust.x += thrust
      }
      if(_gravityAcceleration.x > 0) {
        const thrust = min(_gravityAcceleration.y, _availableNegativeThrust.y)
        _gravityAcceleration.y = max(_gravityAcceleration.y - _availableNegativeThrust.y, 0)
        _availableNegativeThrust.y -= thrust
      } else if(_gravityAcceleration.y < 0) {
        const thrust = max(_gravityAcceleration.y, -_availablePositiveThrust.y)
        _gravityAcceleration.y = min(_gravityAcceleration.y + _availablePositiveThrust.y, 0)
        _availablePositiveThrust.y += thrust
      }
      if(_gravityAcceleration.z > 0) {
        const thrust = min(_gravityAcceleration.z, _availableNegativeThrust.z)
        _gravityAcceleration.z = max(_gravityAcceleration.z - _availableNegativeThrust.z, 0)
        _availableNegativeThrust.z -= thrust
      } else if(_gravityAcceleration.z < 0) {
        const thrust = max(_gravityAcceleration.z, -_availablePositiveThrust.z)
        _gravityAcceleration.z = min(_gravityAcceleration.z + _availablePositiveThrust.z, 0)
        _availablePositiveThrust.z += thrust
      }

      _gravityAcceleration.applyQuaternion(_q1.copy(this.#rigidBody.quaternion))
      this.#body.totalGravityVector.copy(_gravityAcceleration)

      // calculate thrust necessary to oppose current undesired movement
    }
    // END DAMPENERS IF

    // calculate thrust to be applied for accelerating
    if(inputState.front_back > 0) {
      _v1.z = _availablePositiveThrust.z
    } else if(inputState.front_back < 0) {
      _v1.z = -_availableNegativeThrust.z
    }
    if(inputState.left_right > 0) {
      _v1.x = _availablePositiveThrust.x
    } else if(inputState.left_right < 0) {
      _v1.x = -_availableNegativeThrust.x
    }
    if(inputState.up_down > 0) {
      _v1.y = _availablePositiveThrust.y
    } else if(inputState.up_down < 0) {
      _v1.y = -_availableNegativeThrust.y
    }
  }

}
