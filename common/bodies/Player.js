import { Sphere } from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import CelestialBody from '/common/CelestialBody.js'

export default class PlayerBody extends CelestialBody {
  constructor() {
    super({
      mass: 1, // kg
      shape: new Sphere(1),
      angularFactor: { x: 0, y: 0, z: 0 },  // prevent the player's body rotating at all by physics (will need to be removed for 0g stuff)
      //linearDamping: 0.9 //TODO: this should actually be inertia dampening (reducing velocity to 0 when that dir isn't pressed)
      // dont use linearDamping bc it does it for gravity too
    })
  }
}