import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const _ray = new THREE.Ray()
const _inverseMatrix = new THREE.Matrix4()
const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()

/**
 * Base class for all components
 */
export default class Component {

  constructor(data, shape, mesh, offset) {
    Object.defineProperties(this, {
      // read-only properties
      shape: { enumerable: true, value: shape },
      mesh: { enumerable: true, value: mesh },
      position: { enumerable: true, value: new THREE.Vector3() },
      offset: { enumerable: true, value: offset }
    })

    data = { // default values
      position: [0, 0, 0],
      ...data // then overwrite with existing data values
    }

    this.position.set(...data.position)
    this.mesh.position.copy(this.position).add(offset) // offset three.js mesh by this component's position in the contraption
  }

  serialize() {
    const data = {}
    data.type = this.type
    data.position = this.position.toArray()
    return data
  }

  raycast(raycaster, intersects) {
    // TODO: bounding sphere intersect stuff
    //_ray.copy(raycaster.ray).recast(raycaster.near)

    const matrixWorld = this.mesh.matrixWorld // represents world-space pos & rotation, conveniently calculated by three.js

    _inverseMatrix.copy(matrixWorld).invert()
    // todo: calc from position instead? (idk how tbh)
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)
    _ray.origin.addScalar(0.5).add(this.offset)

    const intersectFace = intersectBox(_ray, this.boundingBox, _v1)
    if(intersectFace !== null) {

      // calculate floored contraption position offset thing
      _v2.copy(_v1)       // relative to the position of the component (it's mesh technically)
      _v2.subScalar(0.01) // round to nearest integer position (slightly less than 0.5 to avoid jitteryness from floating-point shenanigans)
      _v2.roundToZero()
      _v2.add(this.position)

      // calculate exact distance for raycast distance sorting
      _v1.applyMatrix4(matrixWorld)
      const distance = raycaster.ray.origin.distanceTo(_v1)

      if(distance > raycaster.far) return
      intersects.push({
        distance: distance, // for sorting
        position: _v2.clone(),
        intersectFace: intersectFace,
        object: this,
        type: "component"
      })
    }
  }

  update(world, DT) {
  }
}

const max = Math.max, min = Math.min

// https://gamedev.stackexchange.com/a/18459, translated from C to three.js by me
function intersectBox(ray, box, target) {
  const lb = box.min, rt = box.max,
    invdirx = 1 / ray.direction.x,
    invdiry = 1 / ray.direction.y,
    invdirz = 1 / ray.direction.z,
    origin = ray.origin

  // lb is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
  // r.org is origin of ray
  const t1 = (lb.x - origin.x) * invdirx;
  const t2 = (rt.x - origin.x) * invdirx;
  const t3 = (lb.y - origin.y) * invdiry;
  const t4 = (rt.y - origin.y) * invdiry;
  const t5 = (lb.z - origin.z) * invdirz;
  const t6 = (rt.z - origin.z) * invdirz;

  const tmin = max(max(min(t1, t2), min(t3, t4)), min(t5, t6));
  const tmax = min(min(max(t1, t2), max(t3, t4)), max(t5, t6));

  // if tmax < 0, ray (line) is intersecting AABB, but the whole AABB is behind us
  if(tmax < 0) {
    //t = tmax;
    return null;
  }

  // if tmin > tmax, ray doesn't intersect AABB
  if(tmin > tmax) {
    //t = tmax;
    return null;
  }

  // https://computergraphics.stackexchange.com/a/9506
  // todo: optimize this (this sucks lmao)
  let whichT
  if(tmin == t1) whichT = 1
  if(tmin == t2) whichT = 2
  if(tmin == t3) whichT = 3
  if(tmin == t4) whichT = 4
  if(tmin == t5) whichT = 5
  if(tmin == t6) whichT = 6

  //t = tmin;
  ray.at(tmin >= 0 ? tmin : tmax, target)
  return whichT;
}