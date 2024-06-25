import * as CANNON from 'cannon-es'
import AbstractServerBody from 'engine/server/AbstractServerBody.js'
import { GROUND } from 'engine/PhysicsMaterials.js'
import { check } from 'engine/util.js'

export default class TestServerBody extends AbstractServerBody {

  constructor(data, world) {
    const is_static = check(data.is_static, "boolean")
    const is_box = check(data.is_box, "boolean")

    let shape
    if(is_box) {
      const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5)
      shape = new CANNON.Box(halfExtents)
    } else {
      shape = new CANNON.Sphere(1)
    }

    const rigidBody = new CANNON.Body({
      mass: 70, // kg
      shape: shape,
      material: GROUND,
      type: is_static ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC,
    })

    super(data, world, rigidBody)

    this.is_static = is_static
    this.is_box = is_box
    this.type = "voxilon:test_body"
  }

  serialize() {
    const data = super.serialize()
    data.is_static = this.is_static
    data.is_box = this.is_box
    return data
  }
}
