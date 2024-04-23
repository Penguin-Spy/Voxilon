import ControlSeat from 'engine/components/ControlSeat.js'

import { Vector3, Quaternion } from 'three'
import Input from 'client/Input.js'
import Controller from 'client/Controller.js'

const _v1 = new Vector3()
const _q1 = new Quaternion()
const _q2 = new Quaternion()
let angle = 0

const RIGHT = new Vector3(1, 0, 0)
const UP = new Vector3(0, 1, 0)

const PI = Math.PI, HALF_PI = Math.PI / 2

export default class ContraptionController extends Controller {
  constructor(link, hud, renderer) {
    super(link, hud, renderer)

    this.lookPitch = 0
    this.lookYaw = 0
    this.zoom = 0
  }

  /**
   * @param {ControlSeat} component       the ControlSeat to control with
   */
  activate(component) {
    this.component = component
    this.contraption = component.getParent()
    this.body = this.contraption.getBody()

    this.thrustManager = component.getThrustManager()
    this.gyroManager = component.getGyroManager()

    this.renderer.attach(this.body, this)

    this.baseLookPositionOffset = this.contraption.positionOffset.clone().add(component.position).add(component.lookPositionOffset)
    this.lookPositionOffset.copy(this.baseLookPositionOffset)
    this.lookQuaternion.identity()
    this.lookSpeed = 0.75

    this.lookPitch = 0
    this.lookYaw = 0
    this.zoom = 0   // 0 means at the player's head, >0 means zoomed that many meters backwards

    Input.on("zoom_in", () => { if(this.zoom > 0) { this.zoom -= 1 } })
    Input.on("zoom_out", () => { if(this.zoom < 20) { this.zoom += 1 } })

    Input.on("toggle_inertia_damping", () => { this.setDampeners(!this.dampeners) })
    this.setDampeners(true)
  }

  deactivate() {
    Input.off("zoom_in")
    Input.off("zoom_out")
    Input.off("toggle_inertia_damping")
  }

  setDampeners(dampeners) {
    this.dampeners = dampeners
    this.thrustManager.setDampeners(dampeners)
    this.gyroManager.setDampeners(dampeners)

    this.hud.updateStatus({
      jetpackActive: false, // irrelevant. todo: change HUD interface methods to make more sense for different controllers
      linearDampingActive: dampeners
    })
  }

  handleCameraRotate(deltaTime) {
    // yaw
    if(Input.get('yaw_left')) {
      angle = 1
    } else if(Input.get('yaw_right')) {
      angle = -1
    } else {
      angle = -Input.mouseDX()
    }
    this.lookYaw += angle * this.lookSpeed * deltaTime;
    // keep yaw within π & -π (-180 to 180 degrees)
    if(this.lookYaw > PI) {
      this.lookYaw = -PI
    } else if(this.lookYaw < -PI) {
      this.lookYaw = PI
    }

    // pitch
    if(Input.get('pitch_up')) {
      angle = 1
    } else if(Input.get('pitch_down')) {
      angle = -1
    } else {
      angle = -Input.mouseDY()
    }
    this.lookPitch += angle * this.lookSpeed * deltaTime;
    // keep pitch within .5π & 1.5π (Straight down & straight up)
    if(this.lookPitch > HALF_PI) {
      this.lookPitch = HALF_PI
    } else if(this.lookPitch < -HALF_PI) {
      this.lookPitch = -HALF_PI
    }
  }

  // Updates the lookPositionOffset & lookQuaternion for the camera
  updateCamera() {
    // calculate look quaternion
    _q1.setFromAxisAngle(UP, this.lookYaw)
    _q2.setFromAxisAngle(RIGHT, this.lookPitch)
    _q1.multiply(_q2)
    this.lookQuaternion.copy(this.body.rigidBody.interpolatedQuaternion).multiply(_q1)

    // update zoom offset
    this.lookPositionOffset.copy(this.baseLookPositionOffset)
    _v1.set(0, 0, this.zoom).applyQuaternion(_q1)
    this.lookPositionOffset.add(_v1)
  }

  // mouse movement
  preRender(deltaTime) {

    if(Input.get("dismount")) {
      console.log("dismount")
      // the normal interaction with a seat while the player is riding it is to dismount
      this.link.interact(this.component, false)
    }

    let front_back = 0, left_right = 0, up_down = 0,
      pitch = 0, yaw = 0, roll = 0

    if(Input.get("camera_look")) {
      this.handleCameraRotate(deltaTime)
    } else {
      // handle contraption rotation
      if(Input.get('yaw_left')) {
        yaw = 1
      } else if(Input.get('yaw_right')) {
        yaw = -1
      } else {
        yaw = -Input.mouseDX()
      }

      if(Input.get('pitch_up')) { // pitch is technically inverted in a contraption (TODO: make this 2 settings, one for player & one for contraption)
        pitch = -1
      } else if(Input.get('pitch_down')) {
        pitch = 1
      } else {
        pitch = Input.mouseDY()
      }

      if(Input.get('roll_left')) {
        roll = 1
      } else if(Input.get('roll_right')) {
        roll = -1
      }
    }

    // handle contraption movement
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

    // TODO: these are input actions, need to go through Link
    this.thrustManager.setInputState(front_back, left_right, up_down)
    this.gyroManager.setInputState(pitch, yaw, roll)

    this.updateCamera()
  }

  // Take input data and apply it to the contraption
  update() {
  }
}
