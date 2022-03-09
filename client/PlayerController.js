import "/common/Quaternion.js"

export function PlayerController(input) {
  this.body = null;
  this.input = input;

  this.posDelta = { x: 0, y: 0, z: 0 }

  this.lookSpeed = 1;
  this.moveSpeed = 1;

  // in radians
  this.yaw = 0;
  this.pitch = 0;

  // Attach this controller to the specified CelestialBody
  this.attach = function(body) {
    this.body = body;
  }

  // Take input data and apply it to the player's body
  this.tick = function() {
    this._updatePos();
    this._updateRotation();
  }

  this._updatePos = function() {
    const moveSpeed = this.moveSpeed * 0.05;
    const rotationMatrix = this.body.quaternion.toMatrix(true);
    if (this.input.forward()) {  // -Z = 0 yaw = forward (determined by how matrix multiplication works)
      this.posDelta.x -= rotationMatrix[2][0] * moveSpeed;
      this.posDelta.y -= rotationMatrix[2][1] * moveSpeed;
      this.posDelta.z -= rotationMatrix[2][2] * moveSpeed;
    } else if (this.input.backward()) {
      this.posDelta.x += rotationMatrix[2][0] * moveSpeed;
      this.posDelta.y += rotationMatrix[2][1] * moveSpeed;
      this.posDelta.z += rotationMatrix[2][2] * moveSpeed;
    }

    if (this.input.right()) {
      this.posDelta.x += rotationMatrix[0][0] * moveSpeed;
      this.posDelta.y += rotationMatrix[0][1] * moveSpeed;
      this.posDelta.z += rotationMatrix[0][2] * moveSpeed;
    } else if (this.input.left()) {
      this.posDelta.x -= rotationMatrix[0][0] * moveSpeed;
      this.posDelta.y -= rotationMatrix[0][1] * moveSpeed;
      this.posDelta.z -= rotationMatrix[0][2] * moveSpeed;
    }

    if (this.input.up()) {
      this.posDelta.x += rotationMatrix[1][0] * moveSpeed;
      this.posDelta.y += rotationMatrix[1][1] * moveSpeed;
      this.posDelta.z += rotationMatrix[1][2] * moveSpeed;
    } else if (this.input.down()) {
      this.posDelta.x -= rotationMatrix[1][0] * moveSpeed;
      this.posDelta.y -= rotationMatrix[1][1] * moveSpeed;
      this.posDelta.z -= rotationMatrix[1][2] * moveSpeed;
    }

    /*if(this.input.currentKeys[37]) { // Arrow left
      this.g_light0position.x -= this.body.rotRight[0] * moveSpeed;
      this.g_light0position.y -= this.body.rotRight[1] * moveSpeed;
      this.g_light0position.z -= this.body.rotRight[2] * moveSpeed;
    } else if(this.input.currentKeys[39]) { // Arrow right
      this.g_light0position.x += this.body.rotRight[0] * moveSpeed;
      this.g_light0position.y += this.body.rotRight[1] * moveSpeed;
      this.g_light0position.z += this.body.rotRight[2] * moveSpeed;
    }*/

    /*if(this.input.currentKeys[38]) { // Arrow up
      this.g_light0position.x += this.body.rotUp[0] * moveSpeed;
      this.g_light0position.y += this.body.rotUp[1] * moveSpeed;
      this.g_light0position.z += this.body.rotUp[2] * moveSpeed;
    } else if(this.input.currentKeys[40]) { // Arrow down
      this.g_light0position.x -= this.body.rotUp[0] * moveSpeed;
      this.g_light0position.y -= this.body.rotUp[1] * moveSpeed;
      this.g_light0position.z -= this.body.rotUp[2] * moveSpeed;
    }*/
  }

  this._updateRotation = function() {
    this.yaw += this.input.mouseDeltaX() * this.lookSpeed * 0.005;
    this.pitch += this.input.mouseDeltaY() * this.lookSpeed * 0.005;

    // Rotation of 0π = Straight forward, 2π = Slightly above straight forward
    // Rotation flips from 0π to 2π at straight ahead.
    if (this.yaw > 2.0 * Math.PI)
      this.yaw -= 2.0 * Math.PI;
    else if (this.yaw < 0.0)
      this.yaw += 2.0 * Math.PI;

    // Same as yaw
    if (this.pitch > 2.0 * Math.PI)
      this.pitch -= 2.0 * Math.PI;
    else if (this.pitch < 0.0)
      this.pitch += 2.0 * Math.PI;

    // This keeps pitch within .5π & 1.5π (Straight down & straight up)
    // This only makes sense with a "down" frame of reference
    //   (I.E. the debug map or in a gravity field)
    //   When in a "down" FoR, W/S/Space/Shift should apply based on that FoR, not the camera's Forward/Up
    else if (this.pitch > 0.5 * Math.PI && this.pitch < 1.5 * Math.PI) {
      this.pitch = this.pitch < Math.PI ? 0.5 * Math.PI : 1.5 * Math.PI;
    }

    // Apply rotation
    this.body.quaternion = Quaternion.fromEuler(0, this.pitch, this.yaw);
  }
}