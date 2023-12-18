import Contraption from '/common/Contraption.js'

import { Vector3, Quaternion, Matrix4, BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import Input from '/client/Input.js'
import * as Materials from "/common/PhysicsMaterials.js"
import Components from '/common/components/index.js'
import BuildingRaycaster from '/client/BuildingRaycaster.js'
import { ComponentDirection, rotateBoundingBox } from '/common/components/componentUtil.js'

const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();
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
const _raycaster = new BuildingRaycaster();
_raycaster.far = 10 // intentionally twice the distance used for no intersections
const _fakePointer = { x: 0, y: 0 } // fake pointer bc it's always in the middle of the screen

const defaultPreviewMesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: "#ffff00" }))

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

    Input.on("debug_noclip", () => {
      if(this.body) {
        this.body.setNoclip(!this.body.noclip)
        this.hud.showChatMessage("[debug] noclip " + (this.body.noclip ? "enabled" : "disabled"))
        if(this.body.noclip && !this.jetpackActive) {
          this.toggleJetpack()
        }
      }
    })

    /* building */
    this.selectedHotbarSlot = 0
    this.hotbar = [
      { type: "tool", name: "welder" },
      { type: "tool", name: "grinder" },
      { type: "test", name: "box" }, // name is only used to check this (currently)
      { type: "test", name: "sphere" },
      { type: "component", class: Components["voxilon:cube"] },
      { type: "component", class: Components["voxilon:rectangle"] },
      { type: "component", class: Components["voxilon:wall"] },

      /*{ type: "entity", name: "assembler" },
      { type: "entity", name: "refinery" },
      { type: "entity", name: "battery" },
      { type: "entity", name: "solar_panel" },
      { type: "entity", name: "network_cable" }*/
    ]

    this.selectedItem = false
    this.buildPreview = { // keeps track of current build preview data, such as where the component would get placed
      rotation: 0, // current rotation of build preview component (for Contraption, todo: use quaternion for free-floating/celestial body build preview)
      rotationQuaternion: new Quaternion(), // current quaternion of the current component rotation
      previousQuaternion: new Quaternion(), // for slerping
      slerpPercent: 0,                      // also for slerping
      // filled in at runtime:
      // type: "component" | "standalone" | "celestial_body"
      // position: THREE.Vector3       // placement position
      // quaternion: THREE.Quaternion  // placement quaternion
      // contraption: Contraption      // parent contraption when placing a component
      // celestialBody: CelestialBody  // if type == "celestial_body", the body the build preview is intersecting with
    }

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

    Input.on("rotate_pitch_up", () => this.rotateBuildPreview("pitch_up"))
    Input.on("rotate_pitch_down", () => this.rotateBuildPreview("pitch_down"))
    Input.on("rotate_yaw_left", () => this.rotateBuildPreview("yaw_left"))
    Input.on("rotate_yaw_right", () => this.rotateBuildPreview("yaw_right"))
    Input.on("rotate_roll_left", () => this.rotateBuildPreview("roll_left"))
    Input.on("rotate_roll_right", () => this.rotateBuildPreview("roll_right"))
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

    if(this.selectedItem?.type === "test") { // just for testing
      this.renderer.setPreviewMesh(defaultPreviewMesh)
      this.buildPreview.mesh = defaultPreviewMesh
    } else if(this.selectedItem?.type === "component") {
      this.buildPreview.mesh = this.selectedItem.class.previewMesh
      this.renderer.setPreviewMesh(this.buildPreview.mesh)
    } else {
      this.renderer.clearPreviewMesh()
      this.buildPreview.mesh = undefined
    }
  }

  tryBuild() {
    console.log(this.selectedHotbarSlot, this.selectedItem)
    const buildPreview = this.buildPreview

    if(this.selectedItem.type === "test") { // just for testing
      this.link.newTestBody({
        is_box: this.selectedItem.name === "box",
        position: buildPreview.mesh.position,
        quaternion: buildPreview.mesh.quaternion,
      })

    } else if(this.selectedItem.type === "component") {
      if(buildPreview.type === "standalone") { // standalone new contraption
        console.log("standalone new contraption", buildPreview)
        this.link.newContraption(
          buildPreview.position,
          buildPreview.quaternion,
          {
            type: this.selectedItem.class.type
            // etc.
          })
      } else if(buildPreview.type === "component") { // edit existing contraption
        console.log("edit existing contraption", buildPreview)

        this.link.editContraption(buildPreview.contraption, {
          type: this.selectedItem.class.type,
          position: buildPreview.position, // contraption-relative position
          rotation: buildPreview.rotation
        })

      } else { // place new contraption on celestial body
        console.log("place new contraption on celestial body", buildPreview)
        this.link.newContraption(
          buildPreview.position,
          buildPreview.quaternion,
          {
            type: this.selectedItem.class.type
            // etc.
          },
          buildPreview.celestialBody
        )
      }
    }
  }

  updateBuildPreview() {
    if(this.selectedItem === undefined) return

    const buildPreview = this.buildPreview
    const previewMesh = buildPreview.mesh

    if(this.selectedItem.type === "test") { // just for testing
      previewMesh.position.set(0, 0, -5)
      previewMesh.position.applyQuaternion(this.body.lookQuaternion)
      previewMesh.position.add(this.body.position)
      previewMesh.quaternion.copy(this.body.lookQuaternion)

    } else if(this.selectedItem.type === "component") {
      _raycaster.setFromCamera(_fakePointer, this.renderer.camera)

      const intersects = _raycaster.intersectBuildableBodies(this.link.world.buildableBodies)
      const intersect = intersects[0]
      this._debugIntersects = intersects

      if(intersect) { // show preview mesh aligned against what it collided with
        if(intersect.type === "component") {
          const heldComponent = this.selectedItem.class
          /** @type {Contraption} */
          const parent = intersect.object.parentContraption

          // position of adjacent empty grid space, offset by the preview mesh's bounding box
          const pos = intersect.position // this is already a unique Vector3

          _v1.set(1, 1, 1)  // min + 1
          _v2.copy(heldComponent.boundingBox.max) // max (dimensions)
          _v3.copy(heldComponent.offset) // offset
          rotateBoundingBox(_v1, _v2, _v3, buildPreview.rotation)

          switch(intersect.intersectFace) {
            case 1: // hit on -x, facing +x, get width of bounding box
              pos.x -= _v2.x
              break;
            case 2: // hit on +x, facing -x, no offset needed bc bounding box minimum is 0,0,0
              pos.x += _v1.x
              break;
            case 3:
              pos.y -= _v2.y
              break;
            case 4:
              pos.y += _v1.y
              break;
            case 5:
              pos.z -= _v2.z
              break;
            case 6:
              pos.z += _v1.z
              break;
          }

          buildPreview.type = "component"
          buildPreview.contraption = parent
          buildPreview.position = pos.clone()

          // update rotation quaternion
          _q1.copy(buildPreview.rotationQuaternion)
          if(buildPreview.slerpPercent < 1) {
            buildPreview.slerpPercent += 0.05
            _q1.slerp(buildPreview.previousQuaternion, 1 - buildPreview.slerpPercent)
          }

          // apply to preview mesh
          pos.add(_v3)
          parent.toWorldPosition(pos)

          _q2.copy(parent.getOriginWorldQuaternion())
          _q2.multiply(_q1)

          previewMesh.position.copy(pos)
          previewMesh.quaternion.copy(_q2)


        } else { // celestial body mesh
          previewMesh.position.copy(intersect.point)
          //previewMesh.quaternion.copy(intersect.object.quaternion)
          previewMesh.quaternion.identity()

          _q1.copy(intersect.object.quaternion).conjugate()

          buildPreview.type = "celestial_body"
          buildPreview.celestialBody = intersect.object
          buildPreview.position = intersect.point.clone().sub(intersect.object.position).applyQuaternion(_q1)
          //buildPreview.quaternion = new Quaternion()
          buildPreview.quaternion = _q1.clone()
        }

      } else { // show preview mesh free-floating, relative to player
        // todo: allow relative rotation (home/end: pitch; del/pgdown: yaw; ins/pgup: roll)
        previewMesh.position.set(0, 0, -5)
        previewMesh.position.applyQuaternion(this.body.lookQuaternion)
        previewMesh.position.add(this.body.position)
        previewMesh.quaternion.copy(this.body.lookQuaternion)

        buildPreview.type = "standalone"
        buildPreview.position = previewMesh.position
        buildPreview.quaternion = previewMesh.quaternion
      }
    }
  }

  /**
   * Rotates the current build preview
   * @param {string} direction basically which rotation input was pressed
   */
  rotateBuildPreview(direction) {
    const buildPreview = this.buildPreview

    // temporary simple rotation controls
    let componentAxis = Math.floor(buildPreview.rotation / 4)
    let componentRotation = buildPreview.rotation % 4
    switch(direction) {
      case "pitch_up":
        componentRotation -= 1
        if(componentRotation < 0) componentRotation = 3
        break;
      case "pitch_down":
        componentRotation += 1
        if(componentRotation > 3) componentRotation = 0
        break;
      case "yaw_left":
        componentAxis -= 1
        if(componentAxis < 0) componentAxis = 5
        break;
      case "yaw_right":
        componentAxis += 1
        if(componentAxis > 5) componentAxis = 0
        break;
      /*case "roll_left":
        break;
      case "roll_right":
        break;*/
    }
    buildPreview.rotation = componentAxis * 4 + componentRotation

    // set up slerping
    buildPreview.previousQuaternion.copy(buildPreview.rotationQuaternion)
    buildPreview.rotationQuaternion.identity()
    ComponentDirection.rotateQuaternion(buildPreview.rotationQuaternion, buildPreview.rotation)
    buildPreview.slerpPercent = 0
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
  }

  updateRotation(deltaTime) {
    if(this.jetpackActive) {
      this._updateJetpackRotation(deltaTime)
    } else {
      this._updateGravityRotation(deltaTime)
    }
    this.updateBuildPreview()
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

    _q1.slerp(_q2, min(10 * deltaTime, 1))

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

/**
 * Converts a quaternion to an axis and angle
 * @param {Quaternion} q   The input quaternion
 * @param {Vector3} target The output axis
 * @returns {number}       The output angle
 */
// https://discourse.threejs.org/t/how-to-convert-to-quaternion-to-axisangle/36975
function toAxisAngle(q, target) {
  const angle = 2 * Math.acos(q.w)
  const s = Math.sqrt(1 - q.w * q.w)

  const x = q.x / s
  const y = q.y / s
  const z = q.z / s

  target.set(x, y, z)
  return angle
}
