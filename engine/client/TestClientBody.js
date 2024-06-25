/** @typedef {import('engine/ClientWorld.js').IClientWorld} IClientWorld */

import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import AbstractClientBody from 'engine/client/AbstractClientBody.js'
import { GROUND } from 'engine/PhysicsMaterials.js'
import { check } from 'engine/util.js'
import { DEBUG_GRID, DEBUG_COMPASS } from 'engine/client/RenderMaterials.js'

const geometry = new THREE.BoxGeometry(1, 1, 1);
const staticMesh = new THREE.Mesh(geometry, DEBUG_COMPASS)
const dynamicMesh = new THREE.Mesh(geometry, DEBUG_GRID)

export default class TestClientBody extends AbstractClientBody {

  /**
   * @param {object} data
   * @param {IClientWorld} world
   * @param {CANNON.Body} rigidBody
   */
  constructor(data, world, rigidBody) {
    const is_static = check(data.is_static, "boolean")
    const is_box = check(data.is_box, "boolean")

    if(!rigidBody) {
      let shape
      if(is_box) {
        const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5)
        shape = new CANNON.Box(halfExtents)
      } else {
        shape = new CANNON.Sphere(1)
      }

      rigidBody = new CANNON.Body({
        mass: 70, // kg
        shape: shape,
        material: GROUND,
        type: is_static ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC,
      })
    }

    super(data, world, rigidBody, is_static ? staticMesh.clone() : dynamicMesh.clone())
    this.is_static = is_static
    this.is_box = is_box
    this.type = "voxilon:test_body"
  }
}
