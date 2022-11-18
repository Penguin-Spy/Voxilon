import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import CelestialBody from '/common/CelestialBody.js'

export default class PlayerBody extends CelestialBody {
  constructor() {
    const rigidbody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Sphere(1),
      angularFactor: { x: 0, y: 1, z: 0 }
    })

    super(rigidbody)
  }
}