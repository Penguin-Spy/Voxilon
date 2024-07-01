import AbstractBody from 'engine/AbstractBody.js'

export default class AbstractClientBody extends AbstractBody {
  /**@type {THREE.Mesh} */
  mesh

  constructor(data, world, rigidBody, mesh) {
    super(data, world, rigidBody, data.id)

    //if(mesh) {
    this.mesh = mesh
    //}
  }

  preRender() {
    // copy cannon position & quaternion to three
    //if(this.mesh) {
    // @ts-ignore TODO: Vector3 stuff
    this.mesh.position.copy(this.rigidBody.interpolatedPosition)
    // @ts-ignore TODO: Vector3 stuff
    this.mesh.quaternion.copy(this.rigidBody.interpolatedQuaternion)
    //}
  }

  /** calculates & applies gravity */
  step() {
    super.calculateGravity()
    super.applyGravity()
  }
}
