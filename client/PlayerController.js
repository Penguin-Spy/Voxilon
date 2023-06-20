import Input from '/client/Input.js'
import { Vector3, Quaternion } from 'three'
import * as Materials from "/common/PhysicsMaterials.js"

const _v1 = new Vector3();
const _v2 = new Vector3();
const _q1 = new Quaternion();
const _q2 = new Quaternion();
let angle = 0;

const RIGHT   = new Vector3(1, 0, 0)
const UP      = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)

const HALF_PI = Math.PI / 2;

// strength of jetpack:
const LINEAR_DAMPING = 0.1  // 10%
const WALK_SPEED = 80       // m/s², affected by friction
const JUMP_STRENGTH = 3     // idk the unit lol
const FLY_SPEED = 40        // m/s²

export default class PlayerController {

  constructor() {
    this.lookSpeed = 0.75
    this.walkSpeed = WALK_SPEED
    this.jumpStrength = JUMP_STRENGTH
    this.flySpeed = FLY_SPEED
    
    this.linearDamping = LINEAR_DAMPING
    this.jetpackActive = false;
    
    this.jumpLockout = 0; // counts down steps until player can jump again
    
    this.bodyQuaternion = new Quaternion(); // for storing edits to this before they're applied during the physics
    this.pitch = 0;

    Input.on("toggle_intertia_damping", this.toggleIntertiaDamping.bind(this))
    Input.on("toggle_jetpack", this.toggleJetpack.bind(this))
  }

  // Attach this controller to the specified Link
  attach(link, hud) {
    this.link = link
    this.body = link._playerBody
    this.hud = hud
    hud.updateStatus(this)
  }

  toggleIntertiaDamping() {
    if(this.linearDamping === 0) {
      this.linearDamping = LINEAR_DAMPING
    } else {
      this.linearDamping = 0
    }
    this.hud.updateStatus(this)
  }

  toggleJetpack() {
    this.jetpackActive = !this.jetpackActive
    // if enabling jetpack,
    if(this.jetpackActive) {
      this.body.quaternion.copy(this.body.lookQuaternion)
      this.pitch = 0
    } else {
      this.body.rigidBody.material = Materials.standingPlayer
    }
    this.hud.updateStatus(this)
  }
  
  // Take input data and apply it to the player's body
  updateMovement(DT) {
    this.body.quaternion.copy(this.bodyQuaternion)
    if(this.jetpackActive) {
      this._updateJetpackMovement(DT)
    } else {
      this._updateGravityMovement(DT)
    }
  }

  updateRotation(deltaTime) {
    if(this.jetpackActive) {
      this._updateJetpackRotation(deltaTime)
    } else {
      this._updateGravityRotation(deltaTime)
    }
  }
  
  _updateJetpackRotation(deltaTime) {
    _q1.copy(this.body.quaternion)
    
    // yaw
    if (Input.get('yaw_left')) {
      angle = 1; 
    } else if (Input.get('yaw_right')) {
      angle = -1;
    } else {
       angle = -Input.mouseDX()
    }
    _q2.setFromAxisAngle(UP, angle * this.lookSpeed * deltaTime)
    _q1.multiply(_q2)
    
    // pitch
    if (Input.get('pitch_up')) {
      angle = 1; 
    } else if (Input.get('pitch_down')) {
      angle = -1;
    } else {
       angle = -Input.mouseDY()
    }
    _q2.setFromAxisAngle(RIGHT, angle * this.lookSpeed * deltaTime)
    _q1.multiply(_q2)

    // roll
    if (Input.get('roll_left')) {
      _q2.setFromAxisAngle(FORWARD, this.lookSpeed * deltaTime)
      _q1.multiply(_q2)
    } else if (Input.get('roll_right')) {
      _q2.setFromAxisAngle(FORWARD, -this.lookSpeed * deltaTime)
      _q1.multiply(_q2)
    }
    
    this.bodyQuaternion.copy(_q1)
    this.body.lookQuaternion.copy(_q1)
  }

  _updateGravityRotation(deltaTime) {
    _q1.copy(this.bodyQuaternion)

    // yaw
    if (Input.get('yaw_left')) {
      angle = 1; 
    } else if (Input.get('yaw_right')) {
      angle = -1;
    } else {
       angle = -Input.mouseDX()
    }
    _q2.setFromAxisAngle(UP, angle * this.lookSpeed * deltaTime)
    _q1.multiply(_q2)

    // align player body to gravity
    _v1.copy(this.body.gravityVector).negate() // gravityUP
    _v2.copy(UP).applyQuaternion(_q1) // bodyUP
    _q2.setFromUnitVectors(_v2, _v1)  // angle to rotate bodyUP to gravityUP
    _q2.multiply(_q1)  // include current body rotation

    _q1.slerp(_q2, 10 * deltaTime)

    // pitch
    if (Input.get('pitch_up')) {
      angle = 1; 
    } else if (Input.get('pitch_down')) {
      angle = -1;
    } else {
       angle = -Input.mouseDY()
    }
    this.pitch += angle * this.lookSpeed * deltaTime;
    // keep pitch within .5π & 1.5π (Straight down & straight up)
    if(this.pitch > HALF_PI) {
      this.pitch = HALF_PI
    } else if(this.pitch < -HALF_PI) {
      this.pitch = -HALF_PI
    }
    _q2.setFromAxisAngle(RIGHT, this.pitch)
    _q2.multiplyQuaternions(_q1, _q2)
    
    this.bodyQuaternion.copy(_q1)       // gravity-aligned quaternion
    this.body.lookQuaternion.copy(_q2)  // gravity-aligned quaternion + pitch
  }

  _updateGravityMovement(DT) {
    // reset material to default when in the air (standingPlayer vs. walkingPlayer)
    if(!this.body.onGround) {
      this.body.rigidBody.material = Materials.standingPlayer
      return
    }
    
    _v1.set(0, 0, 0)

    if (Input.get('forward')) {
      _v1.z = -1
    } else if (Input.get('backward')) {
      _v1.z = 1
    }

    if (Input.get('right')) {
      _v1.x = 1
    } else if (Input.get('left')) {
      _v1.x = -1
    }

    _v1.normalize()

    if(this.jumpLockout > 0) this.jumpLockout--;
    if (Input.get('up') && this.jumpLockout == 0) {
      _v1.y += this.jumpStrength
      this.jumpLockout = 10;
    }
    
    _v1.multiplyScalar(this.body.mass * this.walkSpeed * DT); // player movement
    _v1.applyQuaternion(this.body.quaternion) // rotate to world space

    this.link.playerMove(_v1)

    if(_v1.lengthSq() > 0 && this.jumpLockout == 0) {
      this.body.rigidBody.material = Materials.walkingPlayer
    } else {
      this.body.rigidBody.material = Materials.standingPlayer
    }
  }

  _updateJetpackMovement(DT) {
    _v1.set(0, 0, 0)
    // player velocity converted to camera-forward reference frame (camera forward = -Z)
    _v2.copy(this.body.velocity)
      .applyQuaternion(_q1.copy(this.body.quaternion).conjugate())

    if (Input.get('forward')) {
      _v1.z = -1
      _v2.z = 0
    } else if (Input.get('backward')) {
      _v1.z = 1
      _v2.z = 0
    } else {
      _v2.z *= -this.linearDamping
    }

    if (Input.get('right')) {
      _v1.x = 1
      _v2.x = 0
    } else if (Input.get('left')) {
      _v1.x = -1
      _v2.x = 0
    } else {
      _v2.x *= -this.linearDamping
    }

    if (Input.get('up')) {
      _v1.y = 1
      _v2.y = 0
    } else if (Input.get('down')) {
      _v1.y = -1
      _v2.y = 0
    } else {
      _v2.y *= -this.linearDamping
    }

    _v1.normalize().multiplyScalar(this.flySpeed * DT); // player movement
    _v1.add(_v2); // linear damping
    _v1.multiplyScalar(this.body.mass)
    _v1.applyQuaternion(this.body.quaternion) // rotate back to world space

    this.link.playerMove(_v1)
  }
}