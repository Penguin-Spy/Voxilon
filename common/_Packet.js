define(function() {
  return {
    playerAddPacket: {
      encode: function(playerID, username) {
        var arrayBuffer = new ArrayBuffer(1 + 2 + 1);
        var view = new DataView(arrayBuffer);
        view.setInt8(0, 1);
        view.setInt16(1, playerID);
        view.setInt8(3, username.length);
        return Buffer.concat([Buffer.from(arrayBuffer), username]);
      },
      decode: function(buffer) {
      
      }
    },

    movementPacket: {
      encode: function(playerID, position, velocity) {
        var arrayBuffer = new ArrayBuffer(1 + 2 + 1);
        var view = new DataView(arrayBuffer);
        view.setInt8(0, 2);
        view.setInt16(1, playerID);
        view.setFloat64(2, position[0]);
        view.setFloat64(6, position[1]);
        view.setFloat64(10, position[2]);
        view.setFloat64(14, velocity[0]);
        view.setFloat64(18, velocity[1]);
        view.setFloat64(22, velocity[2]);
        return Buffer.from(arrayBuffer);
      },
      decode: function(buffer) {
        console.log(buffer);
        var view = new DataView(buffer.buffer);
        return {
          position: new Float64Array([view.getFloat64(2), view.getFloat64(6), view.getFloat64(10)]),
          velocity: new Float64Array([view.getFloat64(14), view.getFloat64(18), view.getFloat64(22)])
        }
      }
    },

    chatPacket: {
      encode: function(message) {
        var arrayBuffer = new ArrayBuffer(1 + 1);
        var view = new DataView(arrayBuffer);
        view.setInt8(0, 3);
        view.setInt8(1, message.length);
        return Buffer.concat([Buffer.from(arrayBuffer), Buffer.from(message)]);
      },

      decode: function(buffer) {
        console.log(buffer);
        var view = new DataView(buffer.buffer);
        var length = view.getUint8(1) - 130;
        var decodedMessage = buffer.toString('utf8', 2, length + 2);
        return {message: decodedMessage};
      }
    }
  }
})