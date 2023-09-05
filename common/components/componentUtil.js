import { Box3, Vector3, Quaternion } from 'three'

const _q1 = new Quaternion();

const RIGHT = new Vector3(1, 0, 0)
const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)
const PI = Math.PI, HALF_PI = PI / 2, N_HALF_PI = -HALF_PI

/**
 * Creates an offset THREE.Box3 based on the provided width, depth, and height. \
 * The returned offset is from the center of 0,0,0 to the center of the box.
 * @param {number} width
 * @param {number} depth
 * @param {number} height
 * @returns {[THREE.Box3|THREE.Vector3]}
 */
function boundingBoxFromDimensions(width, depth, height) {
  const box = new Box3(
    new Vector3(0, 0, 0),
    new Vector3(width, depth, height)
  )
  const offset = new Vector3((width - 1) / 2, (depth - 1) / 2, (height - 1) / 2)
  return [box, offset]
}

// component direction generation
/**
 * @enum {number}
 */
const ComponentDirection = Object.freeze({
  /** The default direction; represents no rotation */
  PX_UP: 0,
  PX_RIGHT: 1,
  PX_DOWN: 2,
  PX_LEFT: 3,
  NX_UP: 4,
  NX_RIGHT: 5,
  NX_DOWN: 6,
  NX_LEFT: 7,
  PY_UP: 8,
  PY_RIGHT: 9,
  PY_DOWN: 10,
  PY_LEFT: 11,
  NY_UP: 12,
  NY_RIGHT: 13,
  NY_DOWN: 14,
  NY_LEFT: 15,
  PZ_UP: 16,
  PZ_RIGHT: 17,
  PZ_DOWN: 18,
  PZ_LEFT: 19,
  NZ_UP: 20,
  NZ_RIGHT: 21,
  NZ_DOWN: 22,
  NZ_LEFT: 23,

  /**
   * Rotates the given quaternion by the given ComponentDirection
   * @param {THREE.Quaternion} quaternion
   * @param {ComponentDirection} direction
   */
  rotateQuaternion: function (quaternion, direction) {
    // x is RIGHT, y is UP, z is FORWARDS
    switch(direction) {
      case ComponentDirection.PX_UP:
        _q1.setFromAxisAngle(RIGHT, 0)
        quaternion.multiply(_q1)
        break;
      case ComponentDirection.PX_RIGHT:
        _q1.setFromAxisAngle(RIGHT, HALF_PI)
        quaternion.multiply(_q1)
        break;
      case ComponentDirection.PX_DOWN:
        _q1.setFromAxisAngle(RIGHT, PI)
        quaternion.multiply(_q1)
        break;
      case ComponentDirection.PX_LEFT:
        _q1.setFromAxisAngle(RIGHT, N_HALF_PI)
        quaternion.multiply(_q1)
        break;
      case ComponentDirection.NX_UP:
        break;
      case ComponentDirection.NX_RIGHT:
        break;
      case ComponentDirection.NX_DOWN:
        break;
      case ComponentDirection.NX_LEFT:
        break;
      case ComponentDirection.PY_UP:
        break;
      case ComponentDirection.PY_RIGHT:
        break;
      case ComponentDirection.PY_DOWN:
        break;
      case ComponentDirection.PY_LEFT:
        break;
      case ComponentDirection.NY_UP:
        break;
      case ComponentDirection.NY_RIGHT:
        break;
      case ComponentDirection.NY_DOWN:
        break;
      case ComponentDirection.NY_LEFT:
        break;
      case ComponentDirection.PZ_UP:
        break;
      case ComponentDirection.PZ_RIGHT:
        break;
      case ComponentDirection.PZ_DOWN:
        break;
      case ComponentDirection.PZ_LEFT:
        break;
      case ComponentDirection.NZ_UP:
        break;
      case ComponentDirection.NZ_RIGHT:
        break;
      case ComponentDirection.NZ_DOWN:
        break;
      case ComponentDirection.NZ_LEFT:
        break;
    }
  }
})

/**
 * Rotates a bounding box such that it encompasses the component when facing the specified direction.
 * @param {THREE.Vector3} dimensions     The unoriented bounding box's maxima
 * @param {ComponentDirection} direction The direction in which to face
 */

// TODO: should this also rotate the offset? basically should the origin position stay in the same spot on the component (probably) (oh wait almost definitely) (yes 100% but i'm tired rn)
// "bounding box and offset such that"
//* @param {THREE.Vector3} offset         The offset from the origin to the bounding box's center

function rotateBoundingBox(box, direction) {
  let swap
  switch(direction) {
    //case ComponentDirection.PX_UP: break;
    //case ComponentDirection.PX_DOWN: break;
    //case ComponentDirection.NX_UP: break;
    //case ComponentDirection.NX_DOWN: break;
    case ComponentDirection.PX_RIGHT: // z ↔ y
    case ComponentDirection.PX_LEFT:
    case ComponentDirection.NX_RIGHT:
    case ComponentDirection.NX_LEFT:
      swap = box.z
      box.z = box.y
      box.y = swap
      break;
    case ComponentDirection.PY_UP: // x ↔ y
    case ComponentDirection.PY_DOWN:
    case ComponentDirection.NY_UP:
    case ComponentDirection.NY_DOWN:
      swap = box.x
      box.x = box.y
      box.y = swap
      break;
    case ComponentDirection.PY_RIGHT: //x → y, y → z, z → x
    case ComponentDirection.PY_LEFT:
    case ComponentDirection.NY_RIGHT:
    case ComponentDirection.NY_LEFT:
      swap = box.x
      box.x = box.z
      box.z = box.y
      box.y = swap
      break;
    case ComponentDirection.PZ_UP: // x ↔ z
    case ComponentDirection.PZ_DOWN:
    case ComponentDirection.NZ_UP:
    case ComponentDirection.NZ_DOWN:
      swap = box.x
      box.x = box.z
      box.z = swap
      break;
    case ComponentDirection.PZ_RIGHT: // x → z, z → y, y -> x
    case ComponentDirection.PZ_LEFT:
    case ComponentDirection.NZ_RIGHT:
    case ComponentDirection.NZ_LEFT:
      swap = box.x
      box.x = box.y
      box.y = box.z
      box.z = swap
      break;
  }
}

/**
 * Rotates a ComponentDirection on the specified axis in the specified direction
 * @param {ComponentDirection} componentDirection
 * @param {*} axis
 * @param {boolean} direction false for counterclockwise
 */
function rotateComponentDirection(componentDirection, axis, direction) {
  // todo: implement this (for rotating stuff in the build preview)
}

export { boundingBoxFromDimensions, ComponentDirection, rotateBoundingBox }