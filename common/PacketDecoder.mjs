export default {
  textDecoder: new TextDecoder(),

    decode: function(arrayBuffer) {
      const view = new DataView(arrayBuffer);
      const type = view.getUint8(0);

      const packetBytes = new Uint8Array(arrayBuffer, 1);
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
    },

    connect: function(bytes) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      const length = view.getUint8(0);
      return {
        type: "connect",
        username: this.textDecoder.decode(bytes.slice(1, 1+length))
      }
    },
    addBody: function(bytes) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
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
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      return {
        type: "moveBody",
        bodyID: view.getUint16(0),
        position: {
          x: view.getFloat64(2),
          y: view.getFloat64(10),
          z: view.getFloat64(18)
        },
        velocity: {
          x: view.getFloat64(26),
          y: view.getFloat64(34),
          z: view.getFloat64(42)
        }
      };
    },
    chat: function(bytes) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      let length = view.getUint8(0);
      return {
        type: "chat",
        message: this.textDecoder.decode(bytes.slice(1, 1+length))
      }
    },
    removeBody: function(bytes) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      return {
        type: "removeBody",
        bodyID: view.getUint16(0)
      }
    },
    rotateBody: (bytes) => {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      return {
        type: "rotateBody",
        bodyID: view.getUint16(0),
        quaternion: {
          w: view.getFloat64(2),
          x: view.getFloat64(10),
          y: view.getFloat64(18),
          z: view.getFloat64(26)
        },
        angularVelocity: {
          x: view.getFloat64(34),
          y: view.getFloat64(42),
          z: view.getFloat64(50)
        }
      };
    }
  }