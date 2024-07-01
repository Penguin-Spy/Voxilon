import * as CANNON from 'cannon-es'
import * as THREE from 'three'
//import Contraption from 'engine/Contraption.js'
import AbstractServerBody from 'engine/server/AbstractServerBody.js'
import { G } from 'engine/AbstractBody.js'
import { GROUND } from 'engine/PhysicsMaterials.js'
import { check } from 'engine/util.js'

const _v = new THREE.Vector3()

export default class CelestialServerBody extends AbstractServerBody {

  constructor(data, world) {
    const radius = check(data.radius, "number")
    const surfaceGravity = check(data.surfaceGravity, "number")
    const contraptions_data = check(data.contraptions, "object[]")

    const rigidBody = new CANNON.Body({
      mass: surfaceGravity * radius * radius / G,
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC,
      material: GROUND
    })

    super(data, world, rigidBody)
    this.type = "voxilon:celestial_body"
    this.radius = radius
    this.surfaceGravity = surfaceGravity

    this.contraptions = []

    /*contraptions_data.forEach(c_data => {
      this.contraptions.push(new Contraption(c_data, this))
    })*/
  }
  reviveReferences() {
    for(const c of this.contraptions) {
      c.reviveReferences()
    }
  }

  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    data.contraptions = this.contraptions.map(c => c.serialize())
    return data
  }

  addContraption(contraption_data) {
    //this.contraptions.push(new Contraption(contraption_data, this))
  }

  update() {
    // TODO: orbital motion of celestial bodies
    //super.calculateGravity()

    for(const contraption of this.contraptions) {
      contraption.update()
    }
  }
}
