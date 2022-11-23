import * as CANNON from 'https://pmndrs.github.io/cannon-es/dist/cannon-es.js';
import Quaternion from '../common/Quaternion.js'

const Cube = {
  vertexPositions: [
    // Front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
  ],
  vertexIndices: [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23,   // left
  ],
  faceColors: [
    [1.0, 1.0, 1.0, 1.0],    // Front face: white
    [1.0, 0.0, 0.0, 1.0],    // Back face: red
    [0.0, 1.0, 0.0, 1.0],    // Top face: green
    [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
    [1.0, 0.0, 1.0, 1.0],    // Left face: purple
  ],
  textureCoords: [
    // Front
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Back
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Top
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Bottom
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Right
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Left
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ]
}
// Convert the array of colors into a table for all the vertices.
Cube.colors = [];
for (var j = 0; j < Cube.faceColors.length; ++j) {
  const c = Cube.faceColors[j];
  // Repeat each color four times for the four vertices of the face
  Cube.colors = Cube.colors.concat(c, c, c, c);
}

/*Help = {
  vertexPositions: [
    // Front face
    0.0, 0.0, 0.0,  // bottom
    0.0, 0.5, 0.5,  // n
    0.5, 0.5, 0.0,  // e
    0.0, 0.5, -0.5,  // s
    -0.5, 0.5, 0.0,  // w
    0.0, 1.0, 0.0, // top
  ],
  vertexIndices: [
    1, 2, 0,
    2, 3, 0,
    3, 4, 0,
    4, 1, 0,
    1, 2, 5,
    2, 3, 5,
    3, 4, 5,
    4, 1, 5
  ],
  colors: [
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
  ]
}*/

export default class CelestialBody {
  /*
    mesh:      optional, rendering mesh (model & texture)
    rigidBody: optional, CannonJS physics body
  */

  constructor(cannonOptions, mesh) {
    if (cannonOptions.shape === undefined) {
      console.warn("[%s] Creating rigidbody with default shape!", this.constructor.name)
      cannonOptions.shape = new CANNON.Sphere(1)
    }
    cannonOptions.linearDamping = 0  // conservation of momentum
    cannonOptions.angularDamping = 0  // conservation of angular momentum

    this.rigidBody = new CANNON.Body(cannonOptions)

    // may be undefined (if client root body)
    this.mesh = mesh

    /*try {
      //rigidBody.quaternion.toMatrix4 = Quaternion.prototype.toMatrix4
      rigidBody.quaternion.toMatrix = Quaternion.prototype.toMatrix
      rigidBody.quaternion.rotateVector = Quaternion.prototype.rotateVector
    } catch (e) {
      console.error(e)
    }*/
  }

  get position() {
    return this.rigidBody.position
  }
  set position(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z)) throw new TypeError(`setting body position to NaN (${value.x},${value.y},${value.z})`)
    if (this.rigidBody.position.set) {
      this.rigidBody.position.set(
        value.x,
        value.y,
        value.z
      )
    } else {
      this.rigidBody.position = value
    }
  }
  get velocity() {
    return this.rigidBody.velocity
  }
  set velocity(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z)) throw new TypeError(`setting body velocity to NaN (${value.x},${value.y},${value.z})`)
    this.rigidBody.velocity.set(
      value.x,
      value.y,
      value.z
    )
  }

  get quaternion() {
    return this.rigidBody.quaternion
  }

  set quaternion(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z) || isNaN(value.w)) throw new TypeError(`setting body quaternion to NaN (${value.x},${value.y},${value.z},${value.w})`)
    if (this.rigidBody.quaternion.set) {
      this.rigidBody.quaternion.set(
        value.x,
        value.y,
        value.z,
        value.w
      )
    } else {
      this.rigidBody.quaternion.x = value.x
      this.rigidBody.quaternion.y = value.y
      this.rigidBody.quaternion.z = value.z
      this.rigidBody.quaternion.w = value.w
    }
    this.rigidBody.quaternion = this.rigidBody.quaternion.normalize()
  }
  get angularVelocity() {
    return this.rigidBody.angularVelocity
  }
  set angularVelocity(value) {
    if (isNaN(value.x) || isNaN(value.y) || isNaN(value.z)) throw new TypeError(`setting body anglularVelocity to NaN (${value.x},${value.y},${value.z})`)
    this.rigidBody.angularVelocity.set(
      value.x,
      value.y,
      value.z
    )
  }

  update() {

  }
}