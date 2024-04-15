import { Box3, Vector3, Quaternion } from 'three'

const _q1 = new Quaternion();

// x is RIGHT, y is UP, z is FORWARDS
const AXIS_X = new Vector3(1, 0, 0)
const AXIS_Y = new Vector3(0, 1, 0)
const AXIS_Z = new Vector3(0, 0, 1)
const PI = Math.PI, HALF_PI = PI / 2, N_HALF_PI = -HALF_PI

const ROTATE_RIGHT = new Quaternion().setFromAxisAngle(AXIS_X, HALF_PI)  // rotate right
const ROTATE_DOWN = new Quaternion().setFromAxisAngle(AXIS_X, PI)        // rotate down
const ROTATE_LEFT = new Quaternion().setFromAxisAngle(AXIS_X, N_HALF_PI) // rotate left
const FACE_NX = new Quaternion().setFromAxisAngle(AXIS_Y, PI)            // face negative x
const FACE_PY = new Quaternion().setFromAxisAngle(AXIS_Z, HALF_PI)       // face positive y
const FACE_NY = new Quaternion().setFromAxisAngle(AXIS_Z, N_HALF_PI)     // face negative y
const FACE_PZ = new Quaternion().setFromAxisAngle(AXIS_Y, N_HALF_PI)     // face positive z
const FACE_NZ = new Quaternion().setFromAxisAngle(AXIS_Y, HALF_PI)       // face negative z

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


function makeMaterialTransparent(material) {
  if(Array.isArray(material)) {
    material.forEach((material, i, materials) => {
      materials[i] = material.clone()
      materials[i].transparent = true
      materials[i].opacity = 0.8
    })
  } else {
    material = material.clone()
    material.transparent = true
    material.opacity = 0.8
  }
  return material
}
/**
 * Clones a component's mesh to create the mesh for it's build preview
 * @param {THREE.Mesh} mesh The component's original mesh (is not modified)
 * @returns {THREE.Mesh} A clone of the mesh
 */
function generatePreviewMesh(mesh) {
  const previewMesh = mesh.clone()

  if(previewMesh.material) {
    previewMesh.material = makeMaterialTransparent(previewMesh.material)
  } else {
    for(const child of previewMesh.children) {
      child.material = makeMaterialTransparent(child.material)
    }
  }

  return previewMesh
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
  // remember, order of multiplication matters!!
  rotateQuaternion: function (quaternion, direction) {
    switch(direction) {
      //case ComponentDirection.PX_UP: break;
      case ComponentDirection.PX_RIGHT:
        quaternion.multiply(ROTATE_RIGHT)
        break;
      case ComponentDirection.PX_DOWN:
        quaternion.multiply(ROTATE_DOWN)
        break;
      case ComponentDirection.PX_LEFT:
        quaternion.multiply(ROTATE_LEFT)
        break;
      case ComponentDirection.NX_UP:
        quaternion.multiply(FACE_NX)
        break;
      case ComponentDirection.NX_RIGHT:
        quaternion.multiply(FACE_NX).multiply(ROTATE_RIGHT)
        break;
      case ComponentDirection.NX_DOWN:
        quaternion.multiply(FACE_NX).multiply(ROTATE_DOWN)
        break;
      case ComponentDirection.NX_LEFT:
        quaternion.multiply(FACE_NX).multiply(ROTATE_LEFT)
        break;

      case ComponentDirection.PY_UP:
        quaternion.multiply(FACE_PY)
        break;
      case ComponentDirection.PY_RIGHT:
        quaternion.multiply(FACE_PY).multiply(ROTATE_RIGHT)
        break;
      case ComponentDirection.PY_DOWN:
        quaternion.multiply(FACE_PY).multiply(ROTATE_DOWN)
        break;
      case ComponentDirection.PY_LEFT:
        quaternion.multiply(FACE_PY).multiply(ROTATE_LEFT)
        break;
      case ComponentDirection.NY_UP:
        quaternion.multiply(FACE_NY)
        break;
      case ComponentDirection.NY_RIGHT:
        quaternion.multiply(FACE_NY).multiply(ROTATE_RIGHT)
        break;
      case ComponentDirection.NY_DOWN:
        quaternion.multiply(FACE_NY).multiply(ROTATE_DOWN)
        break;
      case ComponentDirection.NY_LEFT:
        quaternion.multiply(FACE_NY).multiply(ROTATE_LEFT)
        break;

      case ComponentDirection.PZ_UP:
        quaternion.multiply(FACE_PZ)
        break;
      case ComponentDirection.PZ_RIGHT:
        quaternion.multiply(FACE_PZ).multiply(ROTATE_RIGHT)
        break;
      case ComponentDirection.PZ_DOWN:
        quaternion.multiply(FACE_PZ).multiply(ROTATE_DOWN)
        break;
      case ComponentDirection.PZ_LEFT:
        quaternion.multiply(FACE_PZ).multiply(ROTATE_LEFT)
        break;
      case ComponentDirection.NZ_UP:
        quaternion.multiply(FACE_NZ)
        break;
      case ComponentDirection.NZ_RIGHT:
        quaternion.multiply(FACE_NZ).multiply(ROTATE_RIGHT)
        break;
      case ComponentDirection.NZ_DOWN:
        quaternion.multiply(FACE_NZ).multiply(ROTATE_DOWN)
        break;
      case ComponentDirection.NZ_LEFT:
        quaternion.multiply(FACE_NZ).multiply(ROTATE_LEFT)
        break;
    }
  },

  /**
   * Gets the axis a ComponentDirection is facing
   *
   * @param {ComponentDirection} direction
   * @returns {number} 0-5: +X -X +Y -Y +Z -Z
   */
  getAxis(direction) {
    if(direction <= ComponentDirection.PX_LEFT) return 0
    if(direction <= ComponentDirection.NX_LEFT) return 1
    if(direction <= ComponentDirection.PY_LEFT) return 2
    if(direction <= ComponentDirection.NY_LEFT) return 3
    if(direction <= ComponentDirection.PZ_LEFT) return 4
    if(direction <= ComponentDirection.NZ_LEFT) return 5
  }
})

/**
 * Rotates a bounding box and offset such that it encompasses the component when facing the specified direction.
 * @param {THREE.Vector3} min            The unoriented bounding box's minima
 * @param {THREE.Vector3} max            The unoriented bounding box's maxima
 * @param {THREE.Vector3} offset         The offset from the origin to the bounding box's center
 * @param {ComponentDirection} direction The direction in which to face
 */
function rotateBoundingBox(min, max, offset, direction) {
  let swap
  switch(direction) {
    //case ComponentDirection.PX_UP: break;   // no rotation of either
    //case ComponentDirection.PX_DOWN: break;
    case ComponentDirection.PX_RIGHT:
    case ComponentDirection.PX_LEFT:
      swap = offset.z     // offset: z ↔ y
      offset.z = offset.y
      offset.y = swap
      swap = max.z        // box: z ↔ y
      max.z = max.y
      max.y = swap
      break;

    case ComponentDirection.NX_UP:
    case ComponentDirection.NX_DOWN:
      /*offset.x *= -1      // offset: flip on x axis
      swap = max.x        // box: flip on x axis
      max.x = min.x
      min.x = swap*/
      break;
    case ComponentDirection.NX_RIGHT:
    case ComponentDirection.NX_LEFT:
      /*offset.x *= -1      // offset: flip on x axis
      swap = max.x        // box: flip on x axis
      max.x = min.x
      min.x = swap*/
      swap = offset.z     // offset: z ↔ y
      offset.z = offset.y
      offset.y = swap
      swap = max.z        // box: z ↔ y
      max.z = max.y
      max.y = swap
      break;


    case ComponentDirection.PY_UP:
    case ComponentDirection.PY_DOWN:
      swap = offset.x     // offset: x ↔ y
      offset.x = offset.y
      offset.y = swap
      swap = max.x        // box: x ↔ y
      max.x = max.y
      max.y = swap
      break;
    case ComponentDirection.PY_RIGHT:
    case ComponentDirection.PY_LEFT:
      swap = offset.x     // offset: x → y, y → z, z → x
      offset.x = offset.z
      offset.z = offset.y
      offset.y = swap
      swap = max.x        // box: x → y, y → z, z → x
      max.x = max.z
      max.z = max.y
      max.y = swap
      break;

    case ComponentDirection.NY_UP:
    case ComponentDirection.NY_DOWN:
      swap = offset.x     // offset: x ↔ y
      offset.x = offset.y
      offset.y = swap
      swap = max.x        // box: x ↔ y
      max.x = max.y
      max.y = swap
      break;
    case ComponentDirection.NY_RIGHT:
    case ComponentDirection.NY_LEFT:
      swap = offset.x     // offset: x → y, y → z, z → x
      offset.x = offset.z
      offset.z = offset.y
      offset.y = swap
      swap = max.x        // box: x → y, y → z, z → x
      max.x = max.z
      max.z = max.y
      max.y = swap
      break;


    case ComponentDirection.PZ_UP:
    case ComponentDirection.PZ_DOWN:
      //offset.z *= -1      // offset: flip on z axis
      swap = offset.x     // offset: x ↔ z
      offset.x = offset.z
      offset.z = swap
      swap = max.x        // box: x ↔ z
      max.x = max.z
      max.z = swap
      //swap = max.x        // box: flip on x axis
      //max.x = min.x
      //min.x = swap
      break;
    case ComponentDirection.PZ_RIGHT:
    //  offset.z *= -1      // offset: flip on z axis
    case ComponentDirection.PZ_LEFT:
      swap = max.x        // box: x → z, z → y, y -> x
      max.x = max.y
      max.y = max.z
      max.z = swap
      swap = offset.x     // offset: x → z, z → y, y -> x
      offset.x = offset.y
      offset.y = offset.z
      offset.z = swap
      break;

    case ComponentDirection.NZ_UP:
    case ComponentDirection.NZ_DOWN:
      //offset.x *= -1      // offset: flip on x axis
      swap = offset.x     // offset: x ↔ z
      offset.x = offset.z
      offset.z = swap
      swap = max.x        // box: x ↔ z
      max.x = max.z
      max.z = swap
      //swap = max.z        // box: flip on z axis
      //max.z = min.z
      //min.z = swap
      break;
    case ComponentDirection.NZ_RIGHT:
    //  offset.z *= -1      // offset: flip on z axis
    case ComponentDirection.NZ_LEFT:
      //offset.x *= -1      // offset: flip on x axis
      swap = offset.x     // offset: x → z, z → y, y -> x
      offset.x = offset.y
      offset.y = offset.z
      offset.z = swap
      swap = max.x        // box: x → z, z → y, y -> x
      max.x = max.y
      max.y = max.z
      max.z = swap
      //swap = max.z        // box: flip on z axis
      //max.z = min.z
      //min.z = swap
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

export { boundingBoxFromDimensions, generatePreviewMesh, ComponentDirection, rotateBoundingBox }
