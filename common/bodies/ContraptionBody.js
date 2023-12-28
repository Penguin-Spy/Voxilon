import * as CANNON from 'cannon'
import * as THREE from 'three'
import Contraption from '/common/Contraption.js'
import Body from "/common/Body.js"
import { GROUND } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()

export default class ContraptionBody extends Body {

  constructor(data) {
    const contraption_data = check(data.contraption, "object")

    const rigidBody = new CANNON.Body({
      mass: 0, // can't be 0 or the body doesn't move (behaves like kinematic???)
      material: GROUND,
      type: CANNON.Body.DYNAMIC,
    })
    const mesh = new THREE.Group()

    super(data, rigidBody, mesh)

    this.contraption = new Contraption(contraption_data, this)
    this.updateMassProperties()
    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:contraption_body" }
    })
  }

  serialize() {
    const data = super.serialize()
    data.contraption = this.contraption.serialize()
    return data
  }

  updateMassProperties() {
    const rigidBody = this.rigidBody

    // calculate total mass & center of mass
    let totalMass = 0
    _v1.set(0, 0, 0)

    this.contraption.components.forEach(component => {
      _v2.copy(component.position).add(component.offset)
      _v2.multiplyScalar(component.mass)
      _v1.add(_v2)

      totalMass += component.mass
    })
    // update total mass & scale offset by total mass to get weighted average
    rigidBody.mass = totalMass
    _v1.multiplyScalar(1 / totalMass) // center of mass


    // move the shapes so the body origin is at the center of mass
    this.contraption.components.forEach(component => {
      const shapeIndex = rigidBody.shapes.indexOf(component.shape)
      if(shapeIndex === -1) { throw new TypeError("Component's shape is not in parent contraption's rigidBody?") }

      _v2.copy(component.position).add(component.offset)
      _v2.sub(_v1)
      rigidBody.shapeOffsets[shapeIndex].copy(_v2)
      component.mesh.position.copy(_v2)
    })

    // calculate the change in center of mass
    _v2.copy(this.contraption.positionOffset).negate()  // save previous center of mass (negated because it's in the opposite direction of the shapes' displacement)
    this.contraption.positionOffset.copy(_v1).negate()  // then store current center of mass
    _v1.sub(_v2)                                        // and calculate the difference

    // move the body so the net displacement is 0
    rigidBody.vectorToWorldFrame(_v1, _v2)
    rigidBody.position.vadd(_v2, rigidBody.position)

    rigidBody.updateMassProperties()
    rigidBody.updateBoundingRadius()
  }

  preRender() {
    super.preRender()

    this.contraption.preRender()
  }

  update(world, DT) {
    super.update(world, DT)

    this.contraption.update(world, DT)
  }

}
