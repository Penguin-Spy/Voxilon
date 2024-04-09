import { PacketType } from '/link/Constants.js'
const { CHAT, LOAD_WORLD, SET_CONTROLLER_STATE } = PacketType

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
  }
}
