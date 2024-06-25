/** @typedef {import('link/Component.js').default} Component */

const PacketType = Object.freeze({
  CHAT: 0,
  LOAD_WORLD: 1,
  SET_CONTROLLER_STATE: 2,
  SYNC_BODY: 3,
  LOAD_BODY: 4,
  SYNC_CHARACTER_STATE: 5,
  INTERACT: 6,
  SCREEN_ACTION: 7,
  SYNC_CONTROL_SEAT_STATE: 8,
  SEND_INPUT_STATE: 9,
})
export { PacketType }

const { CHAT, LOAD_WORLD, SET_CONTROLLER_STATE, SYNC_BODY, LOAD_BODY, SYNC_CHARACTER_STATE, INTERACT, SCREEN_ACTION, SYNC_CONTROL_SEAT_STATE, SEND_INPUT_STATE } = PacketType

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
  },
  /**
   * @param {Component} component
   * @param {string} action
   * @param {object} data
   */
  SCREEN_ACTION(component, action, data) {
    return JSON.stringify({
      $: SCREEN_ACTION,
      id: component.id,
      action,
      data
    })
  },
  SYNC_CONTROL_SEAT_STATE(id, action, data) {
    return JSON.stringify({
      $: SYNC_CONTROL_SEAT_STATE,
      id, action, data
    })
  },
  /**
   * @param {-1|0|1} front_back
   * @param {-1|0|1} left_right
   * @param {-1|0|1} up_down
   * @param {number} pitch_x    adjustment of pitch (`-1|0|1`) for contraption, quaternion x for character
   * @param {number} yaw_y
   * @param {number} roll_z
   * @param {number} [w]
   */
  SEND_INPUT_STATE(front_back, left_right, up_down, pitch_x, yaw_y, roll_z, w) {
    return JSON.stringify({
      $: SEND_INPUT_STATE,
      front_back, left_right, up_down, pitch_x, yaw_y, roll_z, w
    })
  }
}
