import { PacketType } from '/link/Constants.js'
const { CHAT, LOAD_WORLD, ADD_BODY } = PacketType

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
  ADD_BODY(data, is_client_body) {
    return JSON.stringify({
      $: ADD_BODY,
      data, is_client_body
    })
  }
}