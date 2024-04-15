import { Vector3, Quaternion } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const ROTATE = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)

const loader = new GLTFLoader()

export function loadGLTF(path) {
  let modelLoaded, modelLoadFailed
  const loadedPromise = new Promise((resolve, reject) => {
    modelLoaded = resolve
    modelLoadFailed = reject
  })

  loader.load(path,
    function (gltf) {
      console.log("model loaded", gltf)
      /** @type {THREE.Object3D} */
      const object = gltf.scene.children[0]
      for(const child of object.children) {
        child.position.y -= 0.5 // shift down to account for export from Blockbench
        child.quaternion.premultiply(ROTATE) // rotate so that North in Blockbench is PZ_UP as a ComponentRotation
      }
      modelLoaded(object) // return just the contained Object3D (Group), not the whole scene
    },
    function (xhr) { // function can be false instead
      console.log(`'${path}' ${(xhr.loaded / xhr.total * 100)}% loaded`);
    },
    function (error) {
      console.error(`Error loading model ${path} - `, error)
      modelLoadFailed(error)
    }
  )

  return loadedPromise
}
