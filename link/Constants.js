//const SIGNAL_ENDPOINT = "wss://voxilon.penguinspy.dev/signal"
const SIGNAL_ENDPOINT = "wss://voxilon.penguinspy.repl.co/signal"

const PacketType = Object.freeze({
  CHAT: 0,
  LOAD_WORLD: 1,
  ADD_BODY: 2
})

export {
  SIGNAL_ENDPOINT,
  PacketType
}