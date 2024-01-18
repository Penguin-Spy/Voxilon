import Contraption from '/common/Contraption.js'
import Component from '/common/Component.js'

import { Vector3, Quaternion, Matrix4, BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import Input from '/client/Input.js'
import Controller from '/client/Controller.js'

const _v1 = new Vector3()
const _v2 = new Vector3()
const _v3 = new Vector3()
const _q1 = new Quaternion()
const _q2 = new Quaternion()
const _matrix4 = new Matrix4()
let angle = 0

const RIGHT = new Vector3(1, 0, 0)
const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)
const ZERO = new Vector3(0, 0, 0)

const HALF_PI = Math.PI / 2

const max = Math.max, min = Math.min
function toZero(value, delta) {
  if(value > 0) {
    return max(value - delta, 0)
  } else {
    return min(value + delta, 0)
  }
}

export default class ContraptionController extends Controller {
  constructor(manager, link, hud, renderer) {
    super(manager, link, hud, renderer)
  }

  /** @param {Component} component */
  activate(component) {
    this.component = component
    this.contraption = component.getParent()
    this.body = this.contraption.getBody()

    this.componentManager = component.getManager()

    //this.hud.updateStatus(this)
    //this.hud.updateHotbar(this)

    this.renderer.attach(this.body, this)
    //this.body.attach(this)

    this.lookPositionOffset.copy(component.position).add(this.contraption.positionOffset).y += 1
    this.lookQuaternion.identity()
    this.lookSpeed = 0.75

    this.localLookQuaternion = new Quaternion()
    this.pitch = 0
  }

  deactivate() {
  }

  updateCameraRotation(deltaTime) {
    //_q1.copy(this.lookQuaternion)
    _q1.copy(this.localLookQuaternion)

    // yaw
    if(Input.get('yaw_left')) {
      angle = 1;
    } else if(Input.get('yaw_right')) {
      angle = -1;
    } else {
      angle = -Input.mouseDX()
    }
    _q2.setFromAxisAngle(UP, angle * this.lookSpeed * deltaTime)
    _q1.multiply(_q2)

    /*// pitch
    if(Input.get('pitch_up')) {
      angle = 1;
    } else if(Input.get('pitch_down')) {
      angle = -1;
    } else {
      angle = -Input.mouseDY()
    }
    _q2.setFromAxisAngle(RIGHT, angle * this.lookSpeed * deltaTime)
    _q1.multiply(_q2)*/
    // pitch
    if(Input.get('pitch_up')) {
      angle = 1;
    } else if(Input.get('pitch_down')) {
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

    // roll
    /*if(Input.get('roll_left')) {
      _q2.setFromAxisAngle(FORWARD, this.lookSpeed * deltaTime)
      _q1.multiply(_q2)
    } else if(Input.get('roll_right')) {
      _q2.setFromAxisAngle(FORWARD, -this.lookSpeed * deltaTime)
      _q1.multiply(_q2)
    }*/

    //this.lookQuaternion.copy(_q1)
    this.localLookQuaternion.copy(_q1)
    this.lookQuaternion.copy(this.body.rigidBody.interpolatedQuaternion).multiply(_q2)
  }

  // mouse movement
  preRender(deltaTime) {
    this.updateCameraRotation(deltaTime)

    let front_back, left_right, up_down

    if(Input.get("forward")) {
      front_back = 1
    } else if(Input.get("backward")) {
      front_back = -1
    }
    if(Input.get("left")) {
      left_right = 1
    } else if(Input.get("right")) {
      left_right = -1
    }
    if(Input.get("up")) {
      up_down = 1
    } else if(Input.get("down")) {
      up_down = -1
    }

    this.componentManager.setInputState(false, front_back, left_right, up_down)
  }

  // Take input data and apply it to the contraption
  update(DT) {
  }
}
