import { Sphere, RaycastResult } from 'cannon';
import * as THREE from 'three';
import Body from "/common/Body.js";
import { standingPlayer } from "/common/Materials.js";

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const defaultMesh = new THREE.Mesh(geometry, material)

/*const _result = new RaycastResult();
const _raycastOptions = {collisionFilterGroup: 2}; // not the player
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();*/

export default class PlayerBody extends Body {
  // @param local boolean   is this PlayerBody for this client or another player
  constructor(local) {
    super({
      mass: 70, // kg
      shape: new Sphere(1),
      material: standingPlayer,
      angularFactor: { x: 0, y: 0, z: 0 },  // prevent the player's body rotating at all by physics (will need to be removed for 0g stuff)
    }, local ? defaultMesh : false)

    this.onGround = false;
    this.lookQuaternion = new THREE.Quaternion(); // client-side, independent of body rotation & world stepping
    this.controller = null;
    this.rigidBody.collisionFilterMask = 1; // dont get raycast intersected by our own update()
  }

  attach(playerController) {
    this.controller = playerController
  }

  update(world, DT) {
    if(this.controller) {
      this.controller.updateMovement(DT)
    }
    
    super.update(world, DT);

    // check if this player body is touching the ground
    // TODO: make this smarter: check if collision vector is pointing towards the down Frame of Reference (the dir of gravity)
    const ourId = this.rigidBody.id;
    this.onGround = world._physics.contacts.some(e => {
	   return e.bi.id === ourId || e.bj.id === ourId
    })


    
    //this.onGround = false
    /*for(const otherBody of world.gravityBodies) {
      _result.reset()
      //console.log(this.position, otherBody.position, _raycastOptions)
      world._physics.raycastClosest(this.position, otherBody.position, _raycastOptions, _result)
      if(_result.hasHit) {
        //console.log("Hit!", _result);
        if(_result.distance < 1.2) {
          console.log("  distance < 1.2!")
          // uhh
          //result.hitPointWorld
          //this.onGround = true
        }
      }
    }*/
  }
}