import World from '../common/World.js'
import Quaternion from '../common/Quaternion.js'

export default class Link {
  constructor() {
    // create/load world
    this.world

    // create Integrated server
  }

  // starts the game
  start() {
    console.log("woah starting!!")
  }

  /* --- Link interface methods --- */

  tick() {
    // ticks the physics engine and then the Server (crafting machines, belts, vehicles, etc.)
  }

  /* Player body movement */
  /*playerMoveRelative(vector) { }
  playerMoveAbsolute(x, y, z) { }
  playerRotateRelative(quaternion) { }
  playerRotateAbsolute(quaternion) { }*/

  playerMove(vector) { }  // unit vector of direction to move in
  playerRotate(quaternion) { } // sets player's rotation

  /* Chat */
  sendChat(message) { }

}  