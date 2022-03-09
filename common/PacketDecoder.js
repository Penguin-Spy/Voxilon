define(["common/Quaternion"],
function(Quaternion) {
  return {
    textDecoder: new TextDecoder(),

    decode: function(arrayBuffer) {
      let view = new DataView(arrayBuffer);
      let type = view.getUint8(0);

      let packetBytes = new Uint8Array(arrayBuffer, 1);
      switch(type) {
        case 0:
          return this.connect(packetBytes);
        case 1:
          return this.addBody(packetBytes);
        case 2:
          return this.moveBody(packetBytes);
        case 3:
          return this.chat(packetBytes);
        case 4:
          return this.removeBody(packetBytes);
        case 5:
          return this.rotateBody(packetBytes);
        default:
          return {
            type: "Unknown",
            typeByte: type
          }
      }
      // switch on 1st byte
      // return decoded packet via this.TYPE(bytes)
      // using this decoded data does a switch on packet.type string
      return null;
    },

    connect: function(bytes) {
      var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      length = view.getUint8(0);
      return {
        type: "connect",
        username: this.textDecoder.decode(bytes.slice(1, 1+length))
      }
    },
    addBody: function(bytes) {
      var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      let position = {
        x: view.getFloat64(2),
        y: view.getFloat64(10),
        z: view.getFloat64(18)
      }
      let quaternion = {
        w: view.getFloat64(26),
        x: view.getFloat64(34),
        y: view.getFloat64(42),
        z: view.getFloat64(50)
      }
      
      let selfBody = view.getInt8(58) == 1
      let meshNameLength = view.getUint16(59);
      let textureUrlLength = view.getUint16(61);
      let meshName = this.textDecoder.decode(bytes.slice(63, 63+meshNameLength));
      let textureUrl = this.textDecoder.decode(bytes.slice(63+meshNameLength, 63+meshNameLength+textureUrlLength));
      return {
        type: "addBody",
        bodyID: view.getUint16(0),
        position,
        quaternion,
        meshName,
        textureUrl,
        selfBody
      };
    },
    moveBody: function(bytes) {
      var view = new DataView(bytes.buffer, bytes.byteOffset);
      let position = {
        x: view.getFloat64(2),
        y: view.getFloat64(10),
        z: view.getFloat64(18)
      }
      let velocity = new Float64Array(3);
      velocity[0] = view.getFloat64(26);
      velocity[1] = view.getFloat64(34);
      velocity[2] = view.getFloat64(42);
      return {
        type: "moveBody",
        bodyID: view.getUint16(0),
        position: position,
        velocity: velocity
      };
    },
    chat: function(bytes) {
      var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      length = view.getUint8(0);
      return {
        type: "chat",
        message: this.textDecoder.decode(bytes.slice(1, 1+length))
      }
    },
    removeBody: function(bytes) {
      var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      return {
        type: "removeBody",
        bodyID: view.getUint16(0)
      }
    },
    rotateBody: (bytes) => {
      var view = new DataView(bytes.buffer, bytes.byteOffset);
      quaternion = new Quaternion({
        w: view.getFloat64(2),
        x: view.getFloat64(10),
        y: view.getFloat64(18),
        z: view.getFloat64(26)});
      return {
        type: "rotateBody",
        bodyID: view.getUint16(0),
        quaternion: quaternion,
      };
    }
  }
})