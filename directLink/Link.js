import World from '../common/World.js'
import Quaternion from '../common/Quaternion.js'
import PlayerBody from '/common/bodies/Player.js'

export default class Link {
  constructor(worldOptions) {
    /* 
    worldOptions = {
      type: 'file',
      file: [object File]
    }
    */

    // create/load world
    this._world = new World()

    // create player's body
    this._playerBody = new PlayerBody()
    this._playerBody.position = { x: 0, y: 1, z: 0 }
    this._world.addBody(this._playerBody)

    // create Integrated server
  }

  get playerBody() { return this._playerBody }
  //get world() { console.error("accessing Link.world directly!!") }
  get world() { return this._world }

  /* --- Link interface methods --- */

  /* Player body movement */
  /*playerMoveRelative(vector) { }
  playerMoveAbsolute(x, y, z) { }
  playerRotateRelative(quaternion) { }
  playerRotateAbsolute(quaternion) { }*/

  playerMove(moveX, moveY, moveZ) {  // vector of direction to move in (relative to look direction)
    //console.log(this._world.voxilon_stepped)
    //if (!this._world.voxilon_stepped) { return; } // only modify the playerBody once per step
    
    const velocity = Quaternion.prototype.rotateVector.call(
      this._playerBody.quaternion.normalize().conjugate(), [moveX, moveY, moveZ])

    this._playerBody.velocity.x += velocity[0]
    this._playerBody.velocity.y += velocity[1]
    this._playerBody.velocity.z += velocity[2]

    //this._world.voxilon_stepped = false
  }
  playerRotate(quaternion) {  // sets player's rotation
    //if (!this._world.voxilon_stepped) { return; } // only modify the playerBody once per step
    this._playerBody.quaternion = quaternion
    this._playerBody.quaternion = this._playerBody.quaternion.normalize()

    //this._world.voxilon_stepped = false
  }

  /* Chat */
  sendChat(message) { }

}  