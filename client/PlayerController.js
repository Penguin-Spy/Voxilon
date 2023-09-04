import Input from '/client/Input.js'
import { Vector2, Vector3, Quaternion, Raycaster } from 'three'
import * as THREE from 'three'
import * as Materials from "/common/PhysicsMaterials.js"

const _v1 = new Vector3();
const _v2 = new Vector3();
const _q1 = new Quaternion();
const _q2 = new Quaternion();
let angle = 0;

const RIGHT = new Vector3(1, 0, 0)
const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)

const HALF_PI = Math.PI / 2;

// strength of jetpack:
const LINEAR_DAMPING = 20   // m/s²
const WALK_SPEED = 20       // m/s², affected by friction
const JUMP_STRENGTH = 12    // idk the unit lol
const FLY_SPEED = 40        // m/s²

const max = Math.max, min = Math.min
function toZero(value, delta) {
  if(value > 0) {
    return max(value - delta, 0)
  } else {
    return min(value + delta, 0)
  }
}

// outside of HUD because there's only ever one pointer
const _raycaster = new Raycaster();
_raycaster.far = 10 // intentionally twice the distance used for no intersections
const _pointer = { x: 0, y: 0 } // fake pointer bc it's always in the middle of the screen

//TODO: move to static property of class for each component ("previewMesh")
const geometry = new THREE.BoxGeometry(1, 1, 1);
const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#ffff00" }))

export default class PlayerController {

  constructor() {
    /* movement */
    this.lookSpeed = 0.75
    this.walkSpeed = WALK_SPEED
    this.jumpStrength = JUMP_STRENGTH
    this.flySpeed = FLY_SPEED
    this.linearDampingStrength = LINEAR_DAMPING

    this.linearDampingActive = true
    this.jetpackActive = false

    this.jumpLockout = 0 // counts down steps until player can jump again

    this.bodyQuaternion = new Quaternion() // for storing edits to this before they're applied during the physics
    this.pitch = 0

    Input.on("toggle_intertia_damping", () => this.toggleIntertiaDamping())
    Input.on("toggle_jetpack", () => this.toggleJetpack())

    /* building */
    this.selectedHotbarSlot = 0
    this.hotbar = [
      { type: "tool", name: "welder" },
      { type: "tool", name: "grinder" },
      { type: "entity", name: "cube" },
      { type: "entity", name: "slope" },
      { type: "entity", name: "belt" },
      { type: "entity", name: "assembler" },
      { type: "entity", name: "refinery" },
      { type: "entity", name: "battery" },
      { type: "entity", name: "solar_panel" },
      { type: "entity", name: "network_cable" }
    ]

    this.selectedItem = false

    Input.on("build", () => this.tryBuild())
    Input.on("hotbar_1", () => this.setHotbarSlot(0)) // hmm. this is a little silly
    Input.on("hotbar_2", () => this.setHotbarSlot(1))
    Input.on("hotbar_3", () => this.setHotbarSlot(2))
    Input.on("hotbar_4", () => this.setHotbarSlot(3))
    Input.on("hotbar_5", () => this.setHotbarSlot(4))
    Input.on("hotbar_6", () => this.setHotbarSlot(5))
    Input.on("hotbar_7", () => this.setHotbarSlot(6))
    Input.on("hotbar_8", () => this.setHotbarSlot(7))
    Input.on("hotbar_9", () => this.setHotbarSlot(8))
    Input.on("hotbar_0", () => this.setHotbarSlot(9))
  }

  /**
   * Attach this controller to the specified Link
   */
  attach(link, hud, renderer) {
    this.link = link
    this.body = link.playerBody
    this.hud = hud
    this.renderer = renderer // for raycasting for building
    hud.updateStatus(this)
    hud.updateHotbar(this)
  }

  setHotbarSlot(slot) {
    this.selectedHotbarSlot = slot
    this.hud.updateHotbar(this)

    this.selectedItem = this.hotbar[this.selectedHotbarSlot]
    if(this.selectedItem.type === "entity") {
      this.renderer.setPreviewMesh(mesh) // see comment on declaration of `mesh`
    } else {
      this.renderer.clearPreviewMesh()
    }
  }

  tryBuild() {
    console.log(this.selectedHotbarSlot, this.selectedItem)
    if(this.selectedItem.type === "entity") {
      // do entity placement stuff

      this.link.newContraption({
        name: this.selectedItem.name,
        position: this.renderer.previewMesh.position,
        quaternion: this.renderer.previewMesh.quaternion,
      })

      /*pointer.set(Input.mouseX, Input.mouseY)
      raycaster.setFromCamera(pointer, this.renderer.camera)

      const intersects = raycaster.intersectObjects(this.link.world.scene.children)
      console.log(intersects)
      for(let i = 0; i < intersects.length; i++) {
        if(this.selectedItem.name === "cube") {
          intersects[i].object.material.color.set(0xff0000)
        } else {
          intersects[i].object.material.color.setRGB(1, 1, 1)
        }
      }*/
    }
  }

  updatePreviewDistance() {
    if(this.selectedItem.type === "entity") {
      _raycaster.setFromCamera(_pointer, this.renderer.camera)
      const previewMesh = this.renderer.previewMesh

      const intersects = _raycaster.intersectObjects(this.link.world.scene.children)
      // if the first intersect is the preview mesh, get the 2nd one
      const intersect = intersects[0]?.object !== previewMesh ? intersects[0] : intersects[1]

      if(intersect) { // show preview mesh aligned against what it collided with
        //this.previewMeshDistance = intersect.distance
        this.buildPreviewIntersect = intersect

        // todo: set pos & quat from interesection with contraption


        _v1.copy(intersect.point)
        _v1.sub(intersect.object.position)
        //_v1.addScalar(0.5)
        _v1.floor()
        //_v1.subScalar(0.5)
        // _v1.applyQuaternion(intersect.object.quaternion)
        _v1.add(intersect.object.position)

        previewMesh.position.copy(_v1)//.add(intersect.face.normal.divideScalar(2))
        // previewMesh.quaternion.copy(intersect.object.quaternion)



      } else { // show preview mesh free-floating, relative to player
        // todo: allow relative rotation
        previewMesh.position.set(0, 0, -5)
        previewMesh.position.applyQuaternion(this.body.lookQuaternion)
        previewMesh.position.add(this.body.position)
      }
    }
  }

  toggleIntertiaDamping() {
    this.linearDampingActive = !this.linearDampingActive
    this.hud.updateStatus(this)
  }

  toggleJetpack() {
    this.jetpackActive = !this.jetpackActive
    // if enabling jetpack,
    if(this.jetpackActive) {
      this.bodyQuaternion.copy(this.body.lookQuaternion)
      this.pitch = 0
      this.body.rigidBody.material = Materials.STANDING_PLAYER
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
    this.updatePreviewDistance()
  }

  updateRotation(deltaTime) {
    if(this.jetpackActive) {
      this._updateJetpackRotation(deltaTime)
    } else {
      this._updateGravityRotation(deltaTime)
    }
  }

  _updateJetpackRotation(deltaTime) {
    _q1.copy(this.bodyQuaternion)

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

    // pitch
    if(Input.get('pitch_up')) {
      angle = 1;
    } else if(Input.get('pitch_down')) {
      angle = -1;
    } else {
      angle = -Input.mouseDY()
    }
    _q2.setFromAxisAngle(RIGHT, angle * this.lookSpeed * deltaTime)
    _q1.multiply(_q2)

    // roll
    if(Input.get('roll_left')) {
      _q2.setFromAxisAngle(FORWARD, this.lookSpeed * deltaTime)
      _q1.multiply(_q2)
    } else if(Input.get('roll_right')) {
      _q2.setFromAxisAngle(FORWARD, -this.lookSpeed * deltaTime)
      _q1.multiply(_q2)
    }

    this.bodyQuaternion.copy(_q1)
    this.body.lookQuaternion.copy(_q1)
  }

  _updateGravityRotation(deltaTime) {
    _q1.copy(this.bodyQuaternion)

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

    // align player body to gravity
    _v1.copy(this.body.gravityVector).negate() // gravityUP
    _v2.copy(UP).applyQuaternion(_q1) // bodyUP
    _q2.setFromUnitVectors(_v2, _v1)  // angle to rotate bodyUP to gravityUP
    _q2.multiply(_q1)  // include current body rotation

    _q1.slerp(_q2, 10 * deltaTime)

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

    this.bodyQuaternion.copy(_q1)       // gravity-aligned quaternion
    this.body.lookQuaternion.copy(_q2)  // gravity-aligned quaternion + pitch
  }

  _updateGravityMovement(DT) {
    // reset material to default when in the air (STANDING_PLAYER vs. WALKING_PLAYER)
    if(!this.body.onGround) {
      this.body.rigidBody.material = Materials.STANDING_PLAYER
      return
    }

    _v1.set(0, 0, 0)

    if(Input.get('forward')) {
      _v1.z = -1
    } else if(Input.get('backward')) {
      _v1.z = 1
    }

    if(Input.get('right')) {
      _v1.x = 1
    } else if(Input.get('left')) {
      _v1.x = -1
    }

    _v1.normalize()

    if(this.jumpLockout > 0) this.jumpLockout--;
    if(Input.get('up') && this.jumpLockout == 0) {
      _v1.y += this.jumpStrength
      this.jumpLockout = 10;
    }

    _v1.multiplyScalar(this.walkSpeed * DT); // player movement
    _v1.applyQuaternion(this.body.quaternion) // rotate to world space

    // set material based on if player is moving
    if(_v1.lengthSq() > 0 && this.jumpLockout == 0) {
      this.body.rigidBody.material = Materials.WALKING_PLAYER
    } else {
      this.body.rigidBody.material = Materials.STANDING_PLAYER
    }

    _v1.add(this.body.velocity)
    this.link.playerMove(_v1)

  }

  _updateJetpackMovement(DT) {
    _v1.set(0, 0, 0)
    // player velocity converted to camera-forward reference frame (camera forward = -Z)
    _v2.copy(this.body.velocity)
      .applyQuaternion(_q1.copy(this.body.quaternion).conjugate())

    if(Input.get('forward')) {
      _v1.z = -1
      //_v2.z = 0
    } else if(Input.get('backward')) {
      _v1.z = 1
      //_v2.z = 0
    } else if(this.linearDampingActive) {
      _v2.z = toZero(_v2.z, this.linearDampingStrength * DT)
    }

    if(Input.get('right')) {
      _v1.x = 1
      //_v2.x = 0
    } else if(Input.get('left')) {
      _v1.x = -1
      //_v2.x = 0
    } else if(this.linearDampingActive) {
      _v2.x = toZero(_v2.x, this.linearDampingStrength * DT)
    }

    if(Input.get('up')) {
      _v1.y = 1
      //_v2.y = 0
    } else if(Input.get('down')) {
      _v1.y = -1
      //_v2.y = 0
    } else if(this.linearDampingActive) {
      _v2.y = toZero(_v2.y, this.linearDampingStrength * DT)
    }

    _v1.normalize().multiplyScalar(this.flySpeed * DT); // player movement
    _v2.add(_v1)

    _v2.applyQuaternion(this.body.quaternion) // rotate back to world space
    this.link.playerMove(_v2)
  }
}