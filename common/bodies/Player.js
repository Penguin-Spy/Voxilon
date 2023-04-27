import { Sphere } from 'cannon';
import * as THREE from 'three';
import Body from '/common/Body.js'

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const defaultMesh = new THREE.Mesh(geometry, material)

export default class PlayerBody extends Body {
  // @param other boolean   is this PlayerBody for another player, not the client?
  constructor(other) {
    super({
      mass: 1, // kg
      shape: new Sphere(1),
      angularFactor: { x: 0, y: 0, z: 0 },  // prevent the player's body rotating at all by physics (will need to be removed for 0g stuff)
      //linearDamping: 0.9 //TODO: this should actually be inertia dampening (reducing velocity to 0 when that dir isn't pressed)
      // dont use linearDamping bc it does it for gravity too
    }, other ? defaultMesh : undefined)
  }
}