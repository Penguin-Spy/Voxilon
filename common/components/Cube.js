import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Component from "/common/Component.js";
import { DEBUG_COMPASS } from "/common/RenderMaterials.js"
import { check, boundingBoxFromDimensions } from '/common/util.js'

const _ray = new THREE.Ray()
const _inverseMatrix = new THREE.Matrix4()
const _v1 = new THREE.Vector3()

const geometry = new THREE.BoxGeometry(1, 1, 1);
const mesh = new THREE.Mesh(geometry, DEBUG_COMPASS)

const boundingBox = boundingBoxFromDimensions(1, 1, 1)

export default class Cube extends Component {
  constructor(data) {
    const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5)
    const boxShape = new CANNON.Box(halfExtents)

    super(data, boxShape, mesh.clone())
    // read-only properties
    Object.defineProperties(this, {
      type: { enumerable: true, value: "voxilon:cube" },
      boundingBox: { enumerable: true, value: boundingBox }
    })
  }

  raycast(raycaster, intersects) {
    //console.log("raycasting cube", this, raycaster, intersects)

    // bounding sphere intersect stuff
    //_ray.copy(raycaster.ray).recast(raycaster.near)

    const matrixWorld = this.mesh.matrixWorld

    _inverseMatrix.copy(matrixWorld).invert()
    // todo: calc from position instead?
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)

    const intersect = _ray.intersectBox(this.boundingBox, _v1)
    if(intersect !== null) {
      intersects.push({
        point: _v1.applyMatrix4(matrixWorld),
        object: this
      })
    }
  }

  /*serialize() {
    const data = super.serialize()
    return data
  }*/

  static boundingBox = boundingBox
}