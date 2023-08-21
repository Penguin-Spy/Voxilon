import * as CANNON from 'cannon'
import * as THREE from 'three'
import { default as Body, G } from '/common/Body.js'
import { ground } from "/common/PhysicsMaterials.js"
import { grass } from "/common/RenderMaterials.js"
import { check } from '/common/util.js'

let _v = new THREE.Vector3()   

function roundedCubeGeometry(radius, widthSegements, heightSegments) {
  let g = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);
  for(let i = 0; i < g.attributes.position.count; i++){
    _v.fromBufferAttribute(g.attributes.position, i);
    _v.normalize().multiplyScalar(radius); // or v.setLength(r); 
    g.attributes.position.setXYZ(i, _v.x, _v.y, _v.z);
  }
  g.computeVertexNormals();
  return g;
}

export default class CelestialBody extends Body {
  
  constructor(data) {
    const radius = check(data.radius, "number")
    const surfaceGravity = check(data.surfaceGravity, "number")
    
    const geometry = roundedCubeGeometry(radius, 64, 32); //new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, grass)

    const rigidBody = new CANNON.Body({
      mass: surfaceGravity * radius * radius / G,
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC,
      material: ground
    })
    
    super(data, rigidBody, mesh)

    this.radius = radius
    this.surfaceGravity = surfaceGravity
  }

  get type() { return "voxilon:celestial_body" }
  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    return data
  }

  /*update(world, DT) {
    super(world, DT)
  }*/
}