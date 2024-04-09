import * as THREE from 'three';

const _v = new THREE.Vector3()

export default class Renderer {
  #previewMesh = false

  constructor(link) {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    })

    this.body = null
    this.scene = new THREE.Scene()//link.world.scene

    // initalize the scene
    this.scene.background = new THREE.CubeTextureLoader()
      .setPath('assets/')
      .load([
        'nx.png', // +x  1
        'px.png', // -x  2
        'py.png', // +y  3
        'ny.png', // -y  4
        'pz.png', // +z  5
        'nz.png'  // -z   6
      ])
    this.scene.background.magFilter = THREE.NearestFilter

    this.scene.add(new THREE.AmbientLight(0x404040, 60))
  }

  resize(width, height) {
    const aspect = width / height;

    // resize renderer
    this.renderer.setSize(width, height);
    // resize camera and update matrix
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  getCanvas() {
    return this.renderer.domElement;
  }

  attach(body, controller) {
    this.body = body
    this.controller = controller
  }

  /**
   * Sets the mesh to preview building for.
   * @param {THREE.Mesh} [mesh] The preview mesh
   */
  setPreviewMesh(mesh) {
    if(this.#previewMesh) this.clearPreviewMesh()
    this.#previewMesh = mesh
    this.scene.add(mesh)
  }

  clearPreviewMesh() {
    this.scene.remove(this.#previewMesh)
    this.#previewMesh = false
  }

  render() {
    _v.copy(this.controller.lookPositionOffset).applyQuaternion(this.body.rigidBody.interpolatedQuaternion)
    this.camera.position.copy(this.body.rigidBody.interpolatedPosition).add(_v)
    this.camera.quaternion.copy(this.controller.lookQuaternion)

    this.renderer.render(this.scene, this.camera);
  }


}
