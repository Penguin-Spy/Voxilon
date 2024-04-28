const PacketType = Object.freeze({
  CHAT: 0,
  LOAD_WORLD: 1,
  SET_CONTROLLER_STATE: 2,
  SYNC_BODY: 3,
  LOAD_BODY: 4,
  SYNC_CHARACTER_STATE: 5,
  INTERACT: 6,
})
export { PacketType }

const { CHAT, LOAD_WORLD, SET_CONTROLLER_STATE, SYNC_BODY, LOAD_BODY, SYNC_CHARACTER_STATE, INTERACT } = PacketType

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
  /** sets the controller & state of a player */
  SET_CONTROLLER_STATE(type, thing) {
    return JSON.stringify({
      $: SET_CONTROLLER_STATE,
      type, id: thing.id
    })
  },
  /** syncs the position, orientation, and motion of a body */
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
  /** adds a new body to the world */
  LOAD_BODY(body) {
    return JSON.stringify({
      $: LOAD_BODY,
      data: body.serialize()
    })
  },
  /** syncs the state of a character entity (movement, jetpack state, or toggles sititng in a seat) */
  SYNC_CHARACTER_STATE(id, action, a, b, c) {
    return JSON.stringify({
      $: SYNC_CHARACTER_STATE,
      id, action, a, b, c
    })
  },
  /** sends an interaction with the component */
  INTERACT(component, alternate) {
    return JSON.stringify({
      $: INTERACT,
      id: component.id, alternate
    })
  }
}
