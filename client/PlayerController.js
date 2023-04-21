import Quaternion from '/common/Quaternion.js'
import Input from '/client/Input.js'

export default class PlayerController {

  constructor() {
    this.lookSpeed = 1
    this.moveSpeed = 1
    this.linearDamping = 0.025

    // in radians
    this.yaw = 0
    this.pitch = 0
  }

  // Attach this controller to the specified Link
  attach(link) {
    this.link = link
  }

  // sets the reference for what direction is "downwards"
  // pass undefined to remove any reference to up (in space, no gravity)
  setDownReference(vector) {

  }

  // Take input data and apply it to the player's body
  update(dt) {
    this._updateRotation();
    this._updatePos(dt);
  }

  _updatePos(dt) {
    let moveX = 0, moveY = 0, moveZ = 0  // relative to camera forward == -Z
    const moveSpeed = this.moveSpeed * 20

    const playerVelocity = this.link.playerBody.velocity
    // player velocity converted to camera-forward reference frame
    const playerVec = Quaternion.prototype.rotateVector.call(
      this.link.playerBody.quaternion.normalize().conjugate(), [playerVelocity.x, playerVelocity.y, playerVelocity.z])

    if (Input.get('forward')) {
      moveZ = -moveSpeed * dt
    } else if (Input.get('backward')) {
      moveZ = moveSpeed * dt
    } else {
      moveZ = playerVec[2] * -this.linearDamping
    }

    if (Input.get('right')) {
      moveX = moveSpeed * dt
    } else if (Input.get('left')) {
      moveX = -moveSpeed * dt
    } else {
      moveX = playerVec[0] * -this.linearDamping
    }

    if (Input.get('up')) {
      moveY = moveSpeed * dt
    } else if (Input.get('down')) {
      moveY = -moveSpeed * dt
    } else {
      moveY = playerVec[1] * -this.linearDamping
    }

    // Three.js has a better rotatevector that doesn't use arrays
    const vec = Quaternion.prototype.rotateVector.call(
      this.link.playerBody.quaternion.normalize(), [moveX, moveY, moveZ])


    this.link.playerMove({
      x: vec[0],
      y: vec[1],
      z: vec[2]
    })
  }

  _updateRotation() {
    this.yaw += Input.mouseDX() * this.lookSpeed * 0.005;
    this.pitch += Input.mouseDY() * this.lookSpeed * 0.005;

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
    this.link.playerRotate(Quaternion.fromEuler(0, this.pitch, this.yaw).normalize().conjugate())
  }
}