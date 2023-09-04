import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { GROUND } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'

import Cube from "/common/components/Cube.js"

// don't try to raycast the contraption itself
const fakeLayers = { test: () => false }

const constructors = {
  "voxilon:cube": Cube,
  /*"voxilon:player_body": PlayerBody,
  "voxilon:test_body": TestBody*/
}

export default class ContraptionBody extends Body {

  constructor(data) {
    const components_data = check(data.components, Array.isArray)

    const rigidBody = new CANNON.Body({
      mass: 1, // can't be 0 or the body doesn't move (behaves like kinematic???)
      material: GROUND,
      type: CANNON.Body.KINEMATIC//DYNAMIC,
    })
    const mesh = new THREE.Group()

    super(data, rigidBody, mesh)

    const components = []
    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:contraption" },
      components: { enumerable: true, value: components },
      // THREE raycaster interface
      layers: { enumerable: true, value: fakeLayers },
      children: { enumerable: true, value: components }
    })

    // load components
    components_data.forEach(c => this.loadComponent(c))
  }

  serialize() {
    const data = super.serialize()
    data.components = this.components.map(c => c.serialize())
    return data
  }

  /**
   * Loads a Component's serialized form and adds it to the Contraption
   * @param data The serialized data
   */
  loadComponent(data) {
    const component = new constructors[data.type](data)

    this.rigidBody.addShape(component.shape, component.position)
    if(component.mesh) this.mesh.add(component.mesh)
    this.components.push(component)
    return component
  }

  update(world, DT) {
    super.update(world, DT)
  }


}