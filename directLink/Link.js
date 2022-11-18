import World from '../common/World.js'
import Quaternion from '../common/Quaternion.js'

export default class Link {
  constructor(client, worldOptions) {
    this.client = client
    /* 
    worldOptions = {
      type: 'file',
      file: [object File]
    }
    */

    // create/load world
    this.world = new World()

    // create Integrated server
  }

  /* --- Link interface methods --- */

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