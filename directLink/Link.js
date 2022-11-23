import World from '../common/World.js'
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

  playerMove(velocity) {  // vector of direction to move in
    this._playerBody.rigidBody.applyImpulse(velocity)
  }
  playerRotate(quaternion) {  // sets player's rotation
    this._playerBody.quaternion = quaternion
    this._playerBody.quaternion = this._playerBody.quaternion.normalize()
  }

  /* Chat */
  sendChat(message) { }

}  