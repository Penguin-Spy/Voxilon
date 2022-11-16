export default {
  textEncoder: new TextEncoder(),

    concatTypedArrays: function(a, b) { // a, b TypedArray of same type
      const c = new (a.constructor)(a.length + b.length);
      c.set(a, 0);
      c.set(b, a.length);
      return c;
    },
    buildReturn: function(id, bytes) {
      return this.concatTypedArrays(new Uint8Array([id]), bytes);
    },

    sanitizeInput: function(message, parseAmp=true) {
      if(parseAmp) {
        message = message.replace(/&/g, "&amp;")
      }
      return message
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    },

    connect: function(username) {
      const lengthBuffer = Uint8Array.from([username.length]);
      const bytes = this.concatTypedArrays(lengthBuffer, this.textEncoder.encode(username));
      return this.buildReturn(0, bytes);
    },
    addBody: function(bodyID, body, selfBody) {
      let bytes = new Uint8Array(2 + 3*8 + 4*8 + 1 + 2 + 2);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      const textureUrl = body.mesh.texture.url ? body.mesh.texture.url : body.mesh.texture
      
      view.setUint16(0, bodyID);
      view.setFloat64(2, body.position.x);
      view.setFloat64(10, body.position.y);
      view.setFloat64(18, body.position.z);
      view.setFloat64(26, body.quaternion.w);
      view.setFloat64(34, body.quaternion.x);
      view.setFloat64(42, body.quaternion.y);
      view.setFloat64(50, body.quaternion.z);
      view.setInt8(58, selfBody ? 1 : 0)
      view.setUint16(59, body.mesh.name.length);
      view.setUint16(61, textureUrl.length);
      
      const encodedMesh = this.textEncoder.encode(body.mesh.name);
      const encodedTexture = this.textEncoder.encode(textureUrl);
      bytes = this.concatTypedArrays(bytes, encodedMesh);
      bytes = this.concatTypedArrays(bytes, encodedTexture);

      return this.buildReturn(1, bytes);
    },
    moveBody: function(bodyID, position, velocity) {
      const bytes = new Uint8Array(2 + 3*8 + 3*8);
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      //console.log(`${position.x},${position.y},${position.z}`)
      view.setUint16(0, bodyID);
      view.setFloat64(2, position.x);
      view.setFloat64(10, position.y);
      view.setFloat64(18, position.z);
      view.setFloat64(26, velocity.x);
      view.setFloat64(34, velocity.y);
      view.setFloat64(42, velocity.z);
      return this.buildReturn(2, bytes);
    },
    chat: function(message) {
      const lengthBuffer = Uint8Array.from([message.length]);
      const bytes = this.concatTypedArrays(lengthBuffer, this.textEncoder.encode(message));
      return this.buildReturn(3, bytes);
    },
    removeBody: function(bodyID) {
      const bytes = new Uint8Array(2);
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      view.setUint16(0, bodyID);
      return this.buildReturn(4, bytes);
    },
    rotateBody: function(bodyID, quaternion, angularVelocity) {
      const bytes = new Uint8Array(2 + 4*8 + 3*8);
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      view.setUint16(0, bodyID);
      view.setFloat64(2, quaternion.w);
      view.setFloat64(10, quaternion.x);
      view.setFloat64(18, quaternion.y);
      view.setFloat64(26, quaternion.z);
      view.setFloat64(34, angularVelocity.x);
      view.setFloat64(42, angularVelocity.y);
      view.setFloat64(50, angularVelocity.z);
      return this.buildReturn(5, bytes);
    }
  }