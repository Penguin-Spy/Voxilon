const PacketType = Object.freeze({
  CHAT: 0,
  LOAD_WORLD: 1,
  SET_CONTROLLER_STATE: 2,
  SYNC_BODY: 3,
  LOAD_BODY: 4
})
export { PacketType }

const { CHAT, LOAD_WORLD, SET_CONTROLLER_STATE, SYNC_BODY, LOAD_BODY } = PacketType

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
  SET_CONTROLLER_STATE(type, thing) {
    return JSON.stringify({
      $: SET_CONTROLLER_STATE,
      type, id: thing.id
    })
  },
  SYNC_BODY(body) {
    return JSON.stringify({
      $: SYNC_BODY,
      i: body.id,
      p: body.position.toArray(),
      v: body.velocity.toArray(),
      q: body.quaternion.toArray(),
      a: body.angularVelocity.toArray()
    })
  },
  LOAD_BODY(body) {
    return JSON.stringify({
      $: LOAD_BODY,
      data: body.serialize()
    })
  }
}
