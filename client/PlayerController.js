import Quaternion from '../common/Quaternion.js'

export default class PlayerController {
  body
  input
  moveVector
  lookSpeed
  moveSpeed
  yaw
  pitch
  
  constructor(input) {
    this.body = null;
    this.input = input;

    this.moveVector = { x: 0, y: 0, z: 0 }

    this.lookSpeed = 1;
    this.moveSpeed = 1;

    // in radians
    this.yaw = 0;
    this.pitch = 0;
  }

  // Attach this controller to the specified CelestialBody
  attach(body) {
    this.body = body;
  }

  // Take input data and apply it to the player's body
  tick() {
    this.#updatePos();
    this.#updateRotation();
  }

  #updatePos() {
    try {
    this.moveVector = { x: 0, y: 0, z: 0 }
    const moveSpeed = this.moveSpeed * 50;
    const rotationMatrix = this.body.quaternion.toMatrix(true);
    if (this.input.forward) {  // -Z = 0 yaw = forward (determined by how matrix multiplication works)
      this.moveVector.x -= rotationMatrix[2][0] * moveSpeed;
      this.moveVector.y -= rotationMatrix[2][1] * moveSpeed;
      this.moveVector.z -= rotationMatrix[2][2] * moveSpeed;
    } else if (this.input.backward) {
      this.moveVector.x += rotationMatrix[2][0] * moveSpeed;
      this.moveVector.y += rotationMatrix[2][1] * moveSpeed;
      this.moveVector.z += rotationMatrix[2][2] * moveSpeed;
    }

    if (this.input.right) {
      this.moveVector.x += rotationMatrix[0][0] * moveSpeed;
      this.moveVector.y += rotationMatrix[0][1] * moveSpeed;
      this.moveVector.z += rotationMatrix[0][2] * moveSpeed;
    } else if (this.input.left) {
      this.moveVector.x -= rotationMatrix[0][0] * moveSpeed;
      this.moveVector.y -= rotationMatrix[0][1] * moveSpeed;
      this.moveVector.z -= rotationMatrix[0][2] * moveSpeed;
    }

    if (this.input.up) {
      this.moveVector.x += rotationMatrix[1][0] * moveSpeed;
      this.moveVector.y += rotationMatrix[1][1] * moveSpeed;
      this.moveVector.z += rotationMatrix[1][2] * moveSpeed;
    } else if (this.input.down) {
      this.moveVector.x -= rotationMatrix[1][0] * moveSpeed;
      this.moveVector.y -= rotationMatrix[1][1] * moveSpeed;
      this.moveVector.z -= rotationMatrix[1][2] * moveSpeed;
    }
      
  } catch(e) {
    alert(`${e}\n${e.fileName}:${e.lineNumber}`)
  }
  }

  #updateRotation() {
    this.yaw += this.input.mouseDX() * this.lookSpeed * 0.005;
    this.pitch += this.input.mouseDY() * this.lookSpeed * 0.005;

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