import Input from '/client/Input.js'
import { Vector3, Quaternion, Euler } from 'three'

const _v = new Vector3();
const _q1 = new Quaternion();
const _q2 = new Quaternion();
const _euler = new Euler();

const LINEAR_DAMPING = 4 // 0.025
const RIGHT   = new Vector3(1, 0, 0)
const UP      = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)

export default class PlayerController {

  constructor() {
    this.lookSpeed = 0.75 // 0.005
    this.moveSpeed = 40
    this.linearDamping = LINEAR_DAMPING
    this.jetpackActive = false;

    Input.on("toggle_intertia_damping", this.toggleIntertiaDamping.bind(this))
    Input.on("toggle_jetpack", this.toggleJetpack.bind(this))
  }

  // Attach this controller to the specified Link
  attach(link, hud) {
    this.link = link
    this.body = link.playerBody
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

    // consume mouse inputs that may have not been read
    Input.mouseDX()
    Input.mouseDY()

    // update pitch/yaw if toggling into gravity field
    if(!this.jetpackActive) {
      /*_q1.copy(this.body.quaternion)
      _q2.setFromAxisAngle(RIGHT, -90)
      _q1.multiply(_q2)

      _q2.setFromAxisAngle(this.body.gravityVector, 0)*/

      
      //_q2.setFromAxisAngle(this.body.gravityVector, 0).normalize();
      //_q2.identity();
      _q1.copy(this.body.quaternion).conjugate()//.multiply(_q2)
      //this.link.playerRotate(_q1)

      _euler.setFromQuaternion(_q1, "XYZ")
      console.log(this.body.gravityVector, _q2, _euler)

      
    }
    
    this.hud.updateStatus(this)
  }
  
  // Take input data and apply it to the player's body
  update(dt) {
    if(this.jetpackActive) {
      this._updateRotation(dt);
      this._updateJetpackMovement(dt);
    } else {
      this._updateGravityRotation(dt);
      //this._updateGravityMovement(dt);
      this._updateJetpackMovement(dt);
    }
  }

  _updateRotation(dt) {
    _q1.copy(this.body.quaternion)

    // yaw
    _q2.setFromAxisAngle(UP, -Input.mouseDX() * this.lookSpeed * dt)
    _q1.multiply(_q2)
    // pitch
    _q2.setFromAxisAngle(RIGHT, -Input.mouseDY() * this.lookSpeed * dt)
    _q1.multiply(_q2)

    // roll
    if (Input.get('roll_left')) {
      _q2.setFromAxisAngle(FORWARD, this.lookSpeed * dt)
      _q1.multiply(_q2)
    } else if (Input.get('roll_right')) {
      _q2.setFromAxisAngle(FORWARD, -this.lookSpeed * dt)
      _q1.multiply(_q2)
    }
    
    this.link.playerRotate(_q1)
  }

  _updateGravityRotation(dt) {
    
    /*this.body.getWorldDirection(_v) // positive Z of body facing direction

    _v.cross(this.body.gravityVector) // rightwards vector
    
    // pitch
    _q1.copy(this.body.quaternion)
    _q2.setFromAxisAngle(_v1, Input.mouseDY() * this.lookSpeed * -0.005)
    _q1.multiply(_q2)*/

    /*_q1.copy(this.body.quaternion)

    // yaw
    _q2.setFromAxisAngle(UP, Input.mouseDX() * this.lookSpeed * -0.005)
    _q1.multiply(_q2)
    // pitch
    _q2.setFromAxisAngle(RIGHT, Input.mouseDY() * this.lookSpeed * -0.005)
    _q1.multiply(_q2)
    
    this.link.playerRotate(_q1)*/

    // ----------------
    

    // This keeps pitch within .5π & 1.5π (Straight down & straight up)
    // This only makes sense with a "down" frame of reference
    //   (I.E. the debug map or in a gravity field)
    //   When in a "down" FoR, W/S/Space/Shift should apply based on that FoR, not the camera's Forward/Up
    //else if (this.pitch > 0.5 * Math.PI && this.pitch < 1.5 * Math.PI) {
    //  this.pitch = this.pitch < Math.PI ? 0.5 * Math.PI : 1.5 * Math.PI;
    //}


    // calculate gravityRIGHT
    /*_v.copy(FORWARD)
    _v.applyQuaternion(this.body.quaternion)

    _v.cross(this.body.gravityVector)*/
    
    
    /*if (Input.get('yaw_left')) {
      _q2.setFromAxisAngle(UP, this.lookSpeed * dt)
      _q1.multiply(_q2)
    } else if (Input.get('yaw_right')) {
      _q2.setFromAxisAngle(UP, -this.lookSpeed * dt)
      _q1.multiply(_q2)
    }
    
    if (Input.get('pitch_up')) {
      _q2.setFromAxisAngle(RIGHT, this.lookSpeed * dt)
      _q1.multiply(_q2)
    } else if (Input.get('pitch_down')) {
      _q2.setFromAxisAngle(RIGHT, -this.lookSpeed * dt)
      _q1.multiply(_q2)
    }*/

    
    this._updateRotation(dt);

  }

  _updateGravityMovement(dt) {
    
  }

  _updateJetpackMovement(dt) {
    let moveX = 0, moveY = 0, moveZ = 0  // relative to camera forward == -Z

    // player velocity converted to camera-forward reference frame
    _v.copy(this.body.velocity)
             .applyQuaternion(this.body.quaternion.conjugate())

    if (Input.get('forward')) {
      moveZ = -1
    } else if (Input.get('backward')) {
      moveZ = 1
    } else {
      moveZ = _v.z * -this.linearDamping
    }

    if (Input.get('right')) {
      moveX = 1
    } else if (Input.get('left')) {
      moveX = -1
    } else {
      moveX = _v.x * -this.linearDamping
    }

    if (Input.get('up')) {
      moveY = 1
    } else if (Input.get('down')) {
      moveY = -1
    } else {
      moveY = _v.y * -this.linearDamping
    }

    _v.set(moveX, moveY, moveZ).normalize().multiplyScalar(this.moveSpeed * dt)
    _v.applyQuaternion(this.body.quaternion)

    this.link.playerMove(_v)
  }
}