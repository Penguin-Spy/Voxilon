import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import CelestialBody from '/common/CelestialBody.js'

export default class PlayerBody extends CelestialBody {
  constructor() {
    const rigidbody = new CANNON.Body({
      mass: 1, // kg
      shape: new CANNON.Sphere(1),
      angularFactor: { x: 0, y: 0, z: 0 },  // prevent the player's body rotating sideways (will need to be removed for 0g stuff)
      linearDamping: 0.9 //TODO: this should actually be reducing velocity to 0 when that dir isn't pressed
      // basically inertia dampening (but dont use this bc it does it for gravity too)
    })

    super(rigidbody)
  }
}