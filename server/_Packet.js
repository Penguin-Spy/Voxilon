define(function() {
  return {
    _encodeServerPacket: function(type, playerID) {
      var arrayBuffer = new ArrayBuffer(1 + 2);
      var view = new DataView(arrayBuffer);
      view.setInt8(0, 1);
      view.setInt16(1, playerID);
      return Buffer.from(arrayBuffer);
    },
    decode: function(buffer) {
      type = buffer.readUint8();
      switch(type) {
        case 1:
          username = buffer.toString('utf8', 4, buffer.readUInt8(3) + 4)
          data = {
            username: username,
            bodyID: buffer.readUInt16BE(4 + username.length)
          };
          break;
        default: 
          console.log(`[Packet.js] Error: Unknown packet type: ${type}`);
          data = {};
      }
      return {
        type: type,
        data: data
      }
    },
    addPlayer: {
      encode: function(playerID, username, bodyID) {
        return Buffer.concat([
          this._encodeServerPacket(1, playerID), 
          Buffer.from([username.length]),
          Buffer.from([username]),
          Buffer.from([new Uint16Array([bodyID])])
        ]);
      },
      _decode: function(buffer) {
      }
    }
  }
});