/** @typedef {import('link/Player.js').default} Player */

import * as CANNON from 'cannon-es'
import { Vector3, Quaternion } from 'three'
import AbstractServerBody from 'engine/server/AbstractServerBody.js'
import { STANDING_PLAYER, WALKING_PLAYER } from 'engine/PhysicsMaterials.js'
import { check, DT } from 'engine/util.js'

const _v1 = new Vector3()
const _v2 = new Vector3()
const _v3 = new Vector3()
const _q1 = new Quaternion()
const _q2 = new Quaternion()

/**
 * create a fake capsule rigidbody
 * @param {number} radius         Radius of the capsule.
 * @param {number} length         Length of the middle section.
 * @param {number} radialSegments Number of segmented faces around the circumference of the capsule.
 * @returns {CANNON.Body}
 */
function capsuleRigidBody(radius, length, radialSegments) {
  const sphere1 = new CANNON.Sphere(radius)
  const sphere2 = new CANNON.Sphere(radius)
  const cylinder = new CANNON.Cylinder(radius, radius, length, radialSegments)
  const capsule = new CANNON.Body({ mass: 20, type: CANNON.Body.KINEMATIC })
  capsule.addShape(cylinder)
  capsule.addShape(sphere1, { x: 0, y: length / 2, z: 0 })
  capsule.addShape(sphere2, { x: 0, y: -(length / 2), z: 0 })
  return capsule
}

const max = Math.max, min = Math.min
function toZero(value, delta) {
  if(value > 0) {
    return max(value - delta, 0)
  } else {
    return min(value + delta, 0)
  }
}

const LINEAR_DAMPING = 20   // m/s²
const WALK_SPEED = 20       // m/s², affected by friction
const JUMP_STRENGTH = 16    // idk the unit lol
const FLY_SPEED = 40        // m/s²

export default class CharacterServerBody extends AbstractServerBody {
  #front_back; #left_right; #up_down; #x; #y; #z; #w

  // @param local boolean   is this CharacterBody for this client or another player
  constructor(data, world) {
    const mass = 30; //check(data.mass, "number")
    const player_uuid = check(data.player_uuid, "string")

    const rigidBody = capsuleRigidBody(0.4, 1, 12)
    rigidBody.mass = mass
    rigidBody.type = CANNON.Body.DYNAMIC
    rigidBody.material = STANDING_PLAYER
    rigidBody.angularFactor.set(0, 0, 0)  // prevent the player's body rotating at all by physics (will need to be removed for 0g stuff?)

    super(data, world, rigidBody)

    this.type = "voxilon:character_body"

    this.player_uuid = player_uuid
    /** @type {Player} */
    this.player = null

    this.onGround = false
    //this.rigidBody.collisionFilterMask = 1 // dont get raycast intersected by our own update()

    this.walkSpeed = WALK_SPEED
    this.jumpStrength = JUMP_STRENGTH
    this.flySpeed = FLY_SPEED
    this.linearDampingStrength = LINEAR_DAMPING

    this.linearDampingActive = true
    this.jetpackActive = false

    this.jumpLockout = 0 // counts down steps until player can jump again
  }

  serialize() {
    const data = super.serialize()
    data.player_uuid = this.player_uuid
    return data
  }

  /** Receives the self sync packet data */
  /*receiveSelfSync(data) {
    switch(data.action) {
      case "sit":
        this.sitOn(this.world.getComponentByID(data.a))
        break
      case "stopSitting":
        this.stopSitting(this.world.getComponentByID(data.a))
        break
      default:
        throw new TypeError(`unknown character state action ${data.action}`)
    }
  }

  sitOn(seat) {
    this.world.deactivateBody(this)
    if(this.world.isServer) {
      this.sendSelfSync(PacketEncoder.SYNC_CHARACTER_STATE(this.id, "sit", seat.id, null, null))
    }
  }
  stopSitting(seat) {
    this.world.activateBody(this)
    if(this.world.isServer) {
      this.sendSelfSync(PacketEncoder.SYNC_CHARACTER_STATE(this.id, "stopSitting", seat.id, null, null))
    }
  }*/
  /** @param {Player} player  */
  attachPlayer(player) {
    this.player = player
  }
  detachPlayer() {
    this.player = null
  }

  /**
   * @param {-1|0|1} front_back
   * @param {-1|0|1} left_right
   * @param {-1|0|1} up_down
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} w
   */
  setInputState(front_back, left_right, up_down, x, y, z, w) {
    this.#front_back = front_back
    this.#left_right = left_right
    this.#up_down = up_down
    this.#x = x
    this.#y = y
    this.#z = z
    this.#w = w
  }

  setControllerState(dampeners, jetpack) {
    this.linearDampingActive = dampeners
    this.jetpackActive = jetpack
    // if enabling jetpack,
    if(this.jetpackActive) {
      this.rigidBody.material = STANDING_PLAYER
    }
    this.player.setControllerState(dampeners, jetpack)
  }

  _updateGravityMovement() {
    // reset material to default when in the air (STANDING_PLAYER vs. WALKING_PLAYER)
    /*if(!this.onGround) {
      this.rigidBody.material = STANDING_PLAYER
      return
    }*/

    this.quaternion.set(this.#x, this.#y, this.#z, this.#w)

    _v1.set(0, 0, 0)

    if(this.#front_back === 1) {
      _v1.z = -1
    } else if(this.#front_back === -1) {
      _v1.z = 1
    }

    if(this.#left_right === 1) {
      _v1.x = 1
    } else if(this.#left_right === -1) {
      _v1.x = -1
    }

    _v1.normalize()

    if(this.jumpLockout > 0) this.jumpLockout--
    if(this.#up_down === 1 && this.jumpLockout == 0) {
      _v1.y += this.jumpStrength
      this.jumpLockout = 10;
    }

    _v1.multiplyScalar(this.walkSpeed * DT); // player movement
    _v1.applyQuaternion(this.quaternion) // rotate to world space

    // set material based on if player is moving
    if(_v1.lengthSq() > 0 && this.jumpLockout == 0) {
      this.rigidBody.material = WALKING_PLAYER
    } else {
      this.rigidBody.material = STANDING_PLAYER
    }

    _v1.add(this.velocity)
    this.velocity.copy(_v1)
  }

  _updateJetpackMovement() {
    this.quaternion.set(this.#x, this.#y, this.#z, this.#w)

    _v1.set(0, 0, 0)
    // player velocity converted to camera-forward reference frame (camera forward = -Z)
    _v2.copy(this.velocity)
      .applyQuaternion(_q1.copy(this.quaternion).conjugate())

    if(this.#front_back === 1) {
      _v1.z = -1
      //_v2.z = 0
    } else if(this.#front_back === -1) {
      _v1.z = 1
      //_v2.z = 0
    } else if(this.linearDampingActive) {
      _v2.z = toZero(_v2.z, this.linearDampingStrength * DT)
    }

    if(this.#left_right === 1) {
      _v1.x = 1
      //_v2.x = 0
    } else if(this.#left_right === -1) {
      _v1.x = -1
      //_v2.x = 0
    } else if(this.linearDampingActive) {
      _v2.x = toZero(_v2.x, this.linearDampingStrength * DT)
    }

    if(this.#up_down === 1) {
      _v1.y = 1
      //_v2.y = 0
    } else if(this.#up_down === -1) {
      _v1.y = -1
      //_v2.y = 0
    } else if(this.linearDampingActive) {
      _v2.y = toZero(_v2.y, this.linearDampingStrength * DT)
    }

    _v1.normalize().multiplyScalar(this.flySpeed * DT); // player movement
    _v2.add(_v1)

    _v2.applyQuaternion(this.quaternion) // rotate back to world space
    this.velocity.copy(_v2)
  }

  update() {
    super.calculateGravity()

    if(this.jetpackActive) {
      this._updateJetpackMovement()
    } else {
      this._updateGravityMovement()
    }

    super.applyGravity()

    // check if this player body is touching the ground
    // TODO: make this smarter: check if collision vector is pointing towards the down Frame of Reference (the dir of gravity)
    const ourId = this.rigidBody.id
    this.onGround = this.world.physics.contacts.some(e => {
      return e.bi.id === ourId || e.bj.id === ourId
    })
  }
}

