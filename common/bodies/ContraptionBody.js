import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Body from "/common/Body.js"
import { GROUND } from "/common/PhysicsMaterials.js"
import { check } from '/common/util.js'

import Cube from "/common/components/Cube.js"

const constructors = {
  "voxilon:cube": Cube,
  /*"voxilon:player_body": PlayerBody,
  "voxilon:test_body": TestBody*/
}

/*const geometry = new THREE.BoxGeometry(1, 1, 1);
const staticMesh = new THREE.Mesh(geometry, DEBUG_COMPASS)*/
//const dynamicMesh = new THREE.Mesh(geometry, DEBUG_GRID)

export default class ContraptionBody extends Body {

  constructor(data) {
    const components = check(data.components, Array.isArray)

    /*const rigidBody = new CANNON.Body({
      material: GROUND,
      type: CANNON.Body.DYNAMIC
    })*/
    const rigidBody = new CANNON.Body({
      mass: 1, // can't be 0 or the body doesn't move (behaves like kinematic???)
      material: GROUND,
      type: CANNON.Body.DYNAMIC,
    })
    const mesh = new THREE.Group()

    super(data, rigidBody, mesh)

    this._components = []
    components.forEach(c => this.loadComponent(c))
  }

  get type() { return "voxilon:contraption" }
  serialize() {
    const data = super.serialize()
    data.components = this._components.map(c => c.serialize())
    return data
  }

  loadComponent(data) {
    const component = new constructors[data.type](data)

    this.rigidBody.addShape(component.shape, component.position)
    if(component.mesh) this.mesh.add(component.mesh)
    this._components.push(component)
    return component
  }

  update(world, DT) {
    super.update(world, DT)
  }

}