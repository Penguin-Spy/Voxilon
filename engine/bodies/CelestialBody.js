import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import Contraption from 'engine/Contraption.js'
import { default as Body, G } from 'engine/Body.js'
import { GROUND } from 'engine/PhysicsMaterials.js'
import { GRASS } from 'engine/RenderMaterials.js'
import { check } from 'engine/util.js'

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

  constructor(data, world) {
    const radius = check(data.radius, "number")
    const surfaceGravity = check(data.surfaceGravity, "number")
    const contraptions_data = check(data.contraptions, "object[]")

    const geometry = roundedCubeGeometry(radius, 64, 32); //new THREE.SphereGeometry(radius, 64, 32)
    const mesh = new THREE.Mesh(geometry, GRASS)

    const rigidBody = new CANNON.Body({
      mass: surfaceGravity * radius * radius / G,
      shape: new CANNON.Sphere(radius),
      type: CANNON.Body.KINEMATIC,
      material: GROUND
    })

    super(data, world, rigidBody, mesh)

    this.contraptions = []
    Object.defineProperties(this, {
      // read-only properties
      type: { enumerable: true, value: "voxilon:celestial_body" },
      radius: { enumerable: true, value: radius },
      surfaceGravity: { enumerable: true, value: surfaceGravity }
    })

    contraptions_data.forEach(c_data => {
      this.contraptions.push(new Contraption(c_data, this))
    })
  }
  reviveReferences() {
    for(const c of this.contraptions) {
      c.reviveReferences()
    }
  }

  serialize() {
    const data = super.serialize()
    data.radius = this.radius
    data.surfaceGravity = this.surfaceGravity
    data.contraptions = this.contraptions.map(c => c.serialize())
    return data
  }

  addContraption(contraption_data) {
    this.contraptions.push(new Contraption(contraption_data, this))
  }

  raycast(raycaster, intersects) {
    //console.log("raycasting celestial body", this, raycaster, intersects)
    const fake_intersects = []
    this.mesh.raycast(raycaster, fake_intersects)
    if(fake_intersects.length > 0) {
      fake_intersects[0].object = this
      intersects.push(fake_intersects[0])
    }
    return
  }

  preRender() {
    super.preRender()

    for(const contraption of this.contraptions) {
      contraption.preRender()
    }
  }

  update() {
    super.update()

    for(const contraption of this.contraptions) {
      contraption.update()
    }
  }
}
