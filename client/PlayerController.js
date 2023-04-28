import Input from '/client/Input.js'
import { Vector3, Quaternion, Euler } from 'three'

const _velocity = new Vector3();
const _q1 = new Quaternion();
const _q2 = new Quaternion();
const _euler = new Euler();

const LINEAR_DAMPING = 0.025
const RIGHT   = new Vector3(1, 0, 0)
const UP      = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)

export default class PlayerController {

  constructor() {
    this.lookSpeed = 1
    this.moveSpeed = 1
    this.linearDamping = LINEAR_DAMPING

    // in radians
    this.yaw = 0
    this.pitch = 0
    this.roll = 0

    Input.on("toggle_intertia_damping", this.toggleIntertiaDamping.bind(this))
  }

  // Attach this controller to the specified Link
  attach(link) {
    this.link = link
  }

  // sets the reference for what direction is "downwards"
  // pass undefined to remove any reference to up (in space, no gravity)
  setDownReference(vector) {

  }

  toggleIntertiaDamping() {
    if(this.linearDamping === 0) {
      this.linearDamping = LINEAR_DAMPING
    } else {
      this.linearDamping = 0
    }
    console.log(`toggled: ${this.linearDamping}`)
  }
  
  // Take input data and apply it to the player's body
  update(dt) {
    this._updateRotation(dt);
    this._updatePos(dt);
  }

  _updatePos(dt) {
    let moveX = 0, moveY = 0, moveZ = 0  // relative to camera forward == -Z
    const moveSpeed = this.moveSpeed * 20

    // player velocity converted to camera-forward reference frame
    _velocity.copy(this.link.playerBody.velocity)
             .applyQuaternion(this.link.playerBody.quaternion.conjugate())

    if (Input.get('forward')) {
      moveZ = -moveSpeed * dt
    } else if (Input.get('backward')) {
      moveZ = moveSpeed * dt
    } else {
      moveZ = _velocity.z * -this.linearDamping
    }

    if (Input.get('right')) {
      moveX = moveSpeed * dt
    } else if (Input.get('left')) {
      moveX = -moveSpeed * dt
    } else {
      moveX = _velocity.x * -this.linearDamping
    }

    if (Input.get('up')) {
      moveY = moveSpeed * dt
    } else if (Input.get('down')) {
      moveY = -moveSpeed * dt
    } else {
      moveY = _velocity.y * -this.linearDamping
    }

    _velocity.set(moveX, moveY, moveZ)
    _velocity.applyQuaternion(this.link.playerBody.quaternion)

    this.link.playerMove(_velocity)
  }

  _updateRotation(dt) {
    /*this.yaw += Input.mouseDX() * this.lookSpeed * 0.005;
    this.pitch += Input.mouseDY() * this.lookSpeed * 0.005;

    let moveRoll = 0;
    if (Input.get('roll_left')) {
      moveRoll += 1 * dt
    } else if (Input.get('roll_right')) {
      moveRoll -= 1 * dt
    }
    this.roll += moveRoll

    // Rotation of 0π = Straight forward, 2π = Slightly above straight forward
    // Rotation flips from 0π to 2π at straight ahead.
    if (this.yaw > 2.0 * Math.PI)
      this.yaw -= 2.0 * Math.PI;
    else if (this.yaw < 0.0)
      this.yaw += 2.0 * Math.PI;

    // Same as yaw
    if (this.pitch > 2.0 * Math.PI)
      this.pitch -= 2.0 * Math.PI;
    else if (this.pitch < 0.0)
      this.pitch += 2.0 * Math.PI;

    // This keeps pitch within .5π & 1.5π (Straight down & straight up)
    // This only makes sense with a "down" frame of reference
    //   (I.E. the debug map or in a gravity field)
    //   When in a "down" FoR, W/S/Space/Shift should apply based on that FoR, not the camera's Forward/Up
    else if (this.pitch > 0.5 * Math.PI && this.pitch < 1.5 * Math.PI) {
      this.pitch = this.pitch < Math.PI ? 0.5 * Math.PI : 1.5 * Math.PI;
    }

    // Apply rotation
    _euler.set(this.pitch, this.yaw, this.roll)
    _quaternion.setFromEuler(_euler).conjugate()*/

    _q1.copy(this.link.playerBody.quaternion)

    // yaw
    _q2.setFromAxisAngle(UP, Input.mouseDX() * this.lookSpeed * -0.005)
    _q1.multiply(_q2)
    // pitch
    _q2.setFromAxisAngle(RIGHT, Input.mouseDY() * this.lookSpeed * -0.005)
    _q1.multiply(_q2)

    // roll
    if (Input.get('roll_left')) {
      _q2.setFromAxisAngle(FORWARD, 1 * dt)
    } else if (Input.get('roll_right')) {
      _q2.setFromAxisAngle(FORWARD, -1 * dt)
    }
    _q1.multiply(_q2)
    
    this.link.playerRotate(_q1)
  }
}