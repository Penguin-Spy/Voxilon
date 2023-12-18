import * as CANNON from 'cannon'
import * as THREE from 'three'
import Contraption from '/common/Contraption.js'
import Body from "/common/Body.js"
import { GROUND } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'

export default class ContraptionBody extends Body {

  constructor(data) {
    const contraption_data = check(data.contraption, "object")

    const rigidBody = new CANNON.Body({
      mass: 70, // can't be 0 or the body doesn't move (behaves like kinematic???)
      material: GROUND,
      type: CANNON.Body.DYNAMIC,
    })
    const mesh = new THREE.Group()

    super(data, rigidBody, mesh)

    const contraption = new Contraption(contraption_data, this)
    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:contraption_body" },
      contraption: { enumerable: true, value: contraption }
    })
  }

  serialize() {
    const data = super.serialize()
    data.contraption = this.contraption.serialize()
    return data
  }

  update(world, DT) {
    super.update(world, DT)

    this.contraption.update(world, DT)
  }


}
