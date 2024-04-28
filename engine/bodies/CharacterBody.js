import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Body from 'engine/Body.js'
import { STANDING_PLAYER } from 'engine/PhysicsMaterials.js'
import { check } from 'engine/util.js'
import PacketEncoder from 'link/PacketEncoder.js'

const geometry = new THREE.CapsuleGeometry(0.4, 1, 4, 12)
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const defaultMesh = new THREE.Mesh(geometry, material)

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

export default class CharacterBody extends Body {
  // @param local boolean   is this CharacterBody for this client or another player
  constructor(data, world, local) {
    const mass = 30; //check(data.mass, "number")
    const player_uuid = check(data.player_uuid, "string")

    const rigidBody = capsuleRigidBody(0.4, 1, 12)
    rigidBody.mass = mass
    rigidBody.type = CANNON.Body.DYNAMIC
    rigidBody.material = STANDING_PLAYER
    rigidBody.angularFactor.set(0, 0, 0)  // prevent the player's body rotating at all by physics (will need to be removed for 0g stuff?)

    super(data, world, rigidBody, /*local ?*/ defaultMesh.clone() /*: false*/)
    // read-only properties
    Object.defineProperties(this, {
      type: { enumerable: true, value: "voxilon:character_body" }
    })

    this.player_uuid = player_uuid

    this.onGround = false;
    this.lookQuaternion = new THREE.Quaternion() // client-side, independent of body rotation & world stepping
    this.lookPositionOffset = new THREE.Vector3(0, 0.7, 0) // player center is 0.9m off the ground, so eye height is at 1.6m
    this.controller = null;
    this.rigidBody.collisionFilterMask = 1; // dont get raycast intersected by our own update()
    this.noclip = false;
  }

  serialize() {
    const data = super.serialize()
    data.player_uuid = this.player_uuid
    return data
  }

  /** Receives the self sync packet data */
  receiveSelfSync(data) {
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

  attach(playerController) {
    this.controller = playerController
  }
  detach(playerController) {
    if(this.controller === playerController) {
      this.controller = null
    } else {
      throw new TypeError(`cannot detach controller that is not attached!`)
    }
  }

  setNoclip(state) {
    this.rigidBody.collisionResponse = !state
    this.noclip = state
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
  }

  update() {
    if(!this.noclip) { // noclip will also skip updating the player mesh's position
      super.update()

      // check if this player body is touching the ground
      // TODO: make this smarter: check if collision vector is pointing towards the down Frame of Reference (the dir of gravity)
      const ourId = this.rigidBody.id;
      this.onGround = this.world.physics.contacts.some(e => {
        return e.bi.id === ourId || e.bj.id === ourId
      })
    } else {
      this.onGround = false
    }

    if(this.controller) {
      this.controller.update()
    }
  }
}
