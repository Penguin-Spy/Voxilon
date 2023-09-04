import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { default as Body, G } from '/common/Body.js'
import { GROUND } from "/common/PhysicsMaterials.js"
import { GRASS } from "/common/RenderMaterials.js"
import { check } from '/common/util.js'

let _v = new THREE.Vector3()

function roundedCubeGeometry(radius, widthSegements, heightSegments) {
  let g = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);
  for(let i = 0; i < g.attributes.position.count; i++) {
    _v.fromBufferAttribute(g.attributes.position, i);
    _v.normalize().multiplyScalar(radius); // or v.setLength(r);
    g.attributes.position.setXYZ(i, _v.x, _v.y, _v.z);
  }
  g.computeVertexNormals();
  return g;
}

// THREE raycaster interface
const fakeLayers = { test: () => true } // do try to raycast the celestial body
const fakeChildren = { length: 0 } // don't recurse through children

export default class CelestialBody extends Body {

  constructor(data) {
    const radius = check(data.radius, "number")
    const surfaceGravity = check(data.surfaceGravity, "number")

    const geometry = roundedCubeGeometry(radius, 64, 32); //new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, GRASS)

    const rigidBody = new CANNON.Body({
      mass: surfaceGravity * radius * radius / G,
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC,
      material: GROUND
    })

    super(data, rigidBody, mesh)

    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:celestial_body" },
      radius: { enumerable: true, value: radius },
      surfaceGravity: { enumerable: true, value: surfaceGravity },
      // THREE raycaster interface
      layers: { enumerable: true, value: fakeLayers },
      children: { enumerable: true, value: fakeChildren }
    })
  }

  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    return data
  }

  raycast(raycaster, intersects) {
    //console.log("raycasting celestial body", this, raycaster, intersects)
    return this.mesh.raycast(raycaster, intersects)
  }

  /*update(world, DT) {
    super(world, DT)
  }*/
}