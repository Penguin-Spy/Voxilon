define(function() {
  return {
    textEncoder: new TextEncoder(),

    concatTypedArrays: function(a, b) { // a, b TypedArray of same type
      var c = new (a.constructor)(a.length + b.length);
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
      lengthBuffer = Uint8Array.from([username.length]);
      bytes = this.concatTypedArrays(lengthBuffer, this.textEncoder.encode(username));
      return this.buildReturn(0, bytes);
    },
    addBody: function(bodyID, body, selfBody) {
      var bytes = new Uint8Array(2 + 3*8 + 4*8 + 1 + 2 + 2);
      var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
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
      view.setUint16(61, body.mesh.texture.url.length);
      
      let encodedMesh = this.textEncoder.encode(body.mesh.name);
      let encodedTexture = this.textEncoder.encode(body.mesh.texture.url);
      bytes = this.concatTypedArrays(bytes, encodedMesh);
      bytes = this.concatTypedArrays(bytes, encodedTexture);

      return this.buildReturn(1, bytes);
    },
    moveBody: function(bodyID, position, velocity) {
      var bytes = new Uint8Array(2 + 3*8 + 3*8);
      var view = new DataView(bytes.buffer, bytes.byteOffset);
      //console.log(`${position.x},${position.y},${position.z}`)
      view.setUint16(0, bodyID);
      view.setFloat64(2, position.x);
      view.setFloat64(10, position.y);
      view.setFloat64(18, position.z);
      view.setFloat64(26, velocity[0]);
      view.setFloat64(34, velocity[1]);
      view.setFloat64(42, velocity[2]);
      return this.buildReturn(2, bytes);
    },
    chat: function(message) {
      lengthBuffer = Uint8Array.from([message.length]);
      let bytes = this.concatTypedArrays(lengthBuffer, this.textEncoder.encode(message));
      return this.buildReturn(3, bytes);
    },
    removeBody: function(bodyID) {
      var bytes = new Uint8Array(2);
      var view = new DataView(bytes.buffer, bytes.byteOffset);
      view.setUint16(0, bodyID);
      return this.buildReturn(4, bytes);
    },
    rotateBody: function(bodyID, quaternion) {
      var bytes = new Uint8Array(2 + 4*8);
      var view = new DataView(bytes.buffer, bytes.byteOffset);
      view.setUint16(0, bodyID);
      view.setFloat64(2, quaternion.w);
      view.setFloat64(10, quaternion.x);
      view.setFloat64(18, quaternion.y);
      view.setFloat64(26, quaternion.z);
      return this.buildReturn(5, bytes);
    }
  }
})