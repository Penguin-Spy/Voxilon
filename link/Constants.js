const SIGNAL_ENDPOINT = "wss://voxilon.penguinspy.dev/signal"

const PacketType = Object.freeze({
  CHAT: 0,
  LOAD_WORLD: 1,
  SET_CONTROLLER_STATE: 2,
  SYNC_BODY: 3
})

export {
  SIGNAL_ENDPOINT,
  PacketType
}
