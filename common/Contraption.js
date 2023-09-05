import { Vector3, Quaternion } from 'three'
import { check } from '/common/util.js'
import constructors from '/common/components/index.js'

const _v1 = new Vector3()
const _q1 = new Quaternion()

/**
 * Represents a single contraption in any form (attached to a celestial body, or free-floating)
 */
export default class Contraption {
  #rigidBody; #object3D; #positionOffset; #quaternionOffset;

  /**
   * @param {object}         data                data for the contraption
   * @param {CANNON.Body}    rigidBody           the rigidBody to add shapes to
   * @param {THREE.Object3D} object3D            the Object3D to add meshes to
   * @param {THREE.Vector3?} positionOffset      optional offset of this contraption from the rigidBody's position
   * @param {THREE.Quaternion?} quaternionOffset optional offset of this contraption from the rigidBody's rotation
   */
  constructor(data, rigidBody, object3D, positionOffset, quaternionOffset) {

    const components_data = check(data.components, Array.isArray)

    this.#rigidBody = rigidBody
    this.#object3D = object3D
    this.#positionOffset = positionOffset
    this.#quaternionOffset = quaternionOffset

    const components = []
    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:contraption_body" },
      components: { enumerable: true, value: components }
    })

    // load components
    components_data.forEach(c => this.loadComponent(c))
  }

  /**
   * The position of the Contraption in the world. Modifying this property has no effect, as the Contraption is bound to the position of it's parent.
   */
  get position() {
    if(this.#positionOffset) {
      return _v1.copy(this.#rigidBody.position).add(this.#positionOffset)
    } else {
      return this.#rigidBody.position // technically modifying works if there's no offset, but you shouldn't modify it anyways
    }
  }
  /**
   * The quaternion of the Contraption in the world. Modifying this property has no effect, as the Contraption is bound to the quaternion of it's parent.
   */
  get quaternion() {
    if(this.#quaternionOffset) {
      return _q1.copy(this.#rigidBody.quaternion).add(this.#quaternionOffset)
    } else {
      return this.#rigidBody.quaternion // technically modifying works if there's no offset, but you shouldn't modify it anyways
    }
  }

  serialize() {
    return {
      components: this.components.map(c => c.serialize())
    }
  }

  /**
   * Loads a Component's serialized form and adds it to the Contraption
   * @param data The serialized data
   */
  loadComponent(data) {
    const component = new constructors[data.type](data)

    _v1.copy(component.position).add(component.offset)
    this.#rigidBody.addShape(component.shape, _v1)
    if(component.mesh) this.#object3D.add(component.mesh)
    this.components.push(component)
    component.parentContraption = this
    return component
  }

  update(world, DT) {
    this.components.forEach(c => c.update(world, DT))
  }

}