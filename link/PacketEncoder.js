import { PacketType } from '/link/Constants.js'
const { CHAT, LOAD_WORLD, SET_CONTROLLER_STATE, SYNC_BODY } = PacketType

export default {
  CHAT(author, msg) {
    return JSON.stringify({
      $: CHAT,
      author, msg
    })
  },
  LOAD_WORLD(world_data) {
    return JSON.stringify({
      $: LOAD_WORLD,
      world_data
    })
  },
  SET_CONTROLLER_STATE(type, netID) {
    return JSON.stringify({
      $: SET_CONTROLLER_STATE,
      type, netID
    })
  },
  SYNC_BODY(body) {
    return JSON.stringify({
      $: SYNC_BODY,
      i: body.netID,
      p: body.position.toArray(),
      v: body.velocity.toArray(),
      q: body.quaternion.toArray(),
      a: body.angularVelocity.toArray()
    })
  }
}
