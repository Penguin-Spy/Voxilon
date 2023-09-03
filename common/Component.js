import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default class Component {

  constructor(data, shape, mesh) {
    // --- CANNON ---
    this.shape = shape

    // --- THREE ---
    // may be false to indicate no mesh
    if(mesh) {
      this.mesh = mesh
    }

    data = {// default values
      position: [0, 0, 0],
      ...data // then overwrite with existing data values
    }

    this.position = new THREE.Vector3(...data.position)
    this.mesh.position.copy(this.position)
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