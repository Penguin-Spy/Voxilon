import * as CANNON from 'cannon'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { STANDING_PLAYER } from "/common/PhysicsMaterials.js"
import { check } from "/common/util.js"

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

export default class PlayerBody extends Body {
  // @param local boolean   is this PlayerBody for this client or another player
  constructor(data, local) {
    const mass = 30; //check(data.mass, "number")

    const rigidBody = capsuleRigidBody(0.4, 1, 12)
    rigidBody.mass = mass
    rigidBody.type = CANNON.Body.DYNAMIC
    rigidBody.material = STANDING_PLAYER
    rigidBody.angularFactor.set(0, 0, 0)  // prevent the player's body rotating at all by physics (will need to be removed for 0g stuff?)

    super(data, rigidBody, /*local ?*/ defaultMesh.clone() /*: false*/)
    // read-only properties
    Object.defineProperties(this, {
      type: { enumerable: true, value: "voxilon:player_body" }
    })

    this.onGround = false;
    this.lookQuaternion = new THREE.Quaternion() // client-side, independent of body rotation & world stepping
    this.lookPositionOffset = new THREE.Vector3(0, 0.7, 0) // player center is 0.9m off the ground, so eye height is at 1.6m
    this.controller = null;
    this.rigidBody.collisionFilterMask = 1; // dont get raycast intersected by our own update()
    this.noclip = false;
  }

  serialize() {
    const data = super.serialize()
    return data
  }

  attach(playerController) {
    this.controller = playerController
  }

  setNoclip(state) {
    this.rigidBody.collisionResponse = !state
    this.noclip = state
  }

  update(world, DT) {
    if(!this.noclip) { // noclip will also skip updating the player mesh's position
      super.update(world, DT)

      // check if this player body is touching the ground
      // TODO: make this smarter: check if collision vector is pointing towards the down Frame of Reference (the dir of gravity)
      const ourId = this.rigidBody.id;
      this.onGround = world.physics.contacts.some(e => {
        return e.bi.id === ourId || e.bj.id === ourId
      })
    } else {
      this.onGround = false
    }

    if(this.controller) {
      this.controller.updateMovement(DT)
    }
  }
}
