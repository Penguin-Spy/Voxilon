//import { PacketType } from 'link/PacketEncoder.js'
//const { CHAT, ADD_BODY } = PacketType

export default {
  decode: function(packet) {
    return JSON.parse(packet)
  }
}
