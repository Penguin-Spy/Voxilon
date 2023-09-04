import * as CANNON from 'cannon-es';
import * as THREE from 'three';

// THREE raycaster interface
const fakeLayers = { test: () => true } // do try to raycast the component
const fakeChildren = { length: 0 } // don't recurse through children

/**
 * Base class for all components
 */
export default class Component {

  constructor(data, shape, mesh) {
    // --- THREE ---
    // may be false to indicate no mesh
    if(mesh) {
      Object.defineProperty(this, "mesh", { enumerable: true, value: mesh })
    }

    Object.defineProperties(this, {
      // read-only properties
      shape: { enumerable: true, value: shape },
      position: { enumerable: true, value: new THREE.Vector3() },
      // THREE raycaster interface
      layers: { enumerable: false, value: fakeLayers },
      children: { enumerable: false, value: fakeChildren }
    })

    data = { // default values
      position: [0, 0, 0],
      ...data // then overwrite with existing data values
    }

    this.position.set(...data.position)
    this.mesh.position.copy(this.position) // offset three.js mesh by this component's position in the contraption
  }

  serialize() {
    const data = {}
    data.type = this.type
    data.position = this.position.toArray()
    return data
  }

  update(world, DT) {
  }
}