import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Contraption from '/common/Contraption.js'
import { default as Body, G } from '/common/Body.js'
import { GROUND } from "/common/PhysicsMaterials.js"
import { GRASS } from "/common/RenderMaterials.js"
import { check } from '/common/util.js'

const _v = new THREE.Vector3()
function roundedCubeGeometry(radius, widthSegements, heightSegments) {
  const g = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);
  for(let i = 0; i < g.attributes.position.count; i++) {
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
    const contraptions_data = check(data.contraptions, Array.isArray)

    const geometry = roundedCubeGeometry(radius, 64, 32); //new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, GRASS)

    const rigidBody = new CANNON.Body({
      mass: surfaceGravity * radius * radius / G,
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC,
      material: GROUND
    })

    super(data, rigidBody, mesh)

    const contraptions = []
    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:celestial_body" },
      radius: { enumerable: true, value: radius },
      surfaceGravity: { enumerable: true, value: surfaceGravity },
      contraptions: { enumerable: true, value: contraptions }
    })

    contraptions_data.forEach(c_data => {
      contraptions.push(new Contraption(c_data, rigidBody, mesh))
    })
  }

  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    data.contraptions = this.contraptions.map(c => c.serialize())
    return data
  }

  raycast(raycaster, intersects) {
    //console.log("raycasting celestial body", this, raycaster, intersects)
    return this.mesh.raycast(raycaster, intersects)
  }

  update(world, DT) {
    super.update(world, DT)

    this.contraptions.forEach(c => c.update(world, DT))
  }
}