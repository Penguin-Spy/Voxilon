import * as THREE from 'three';

export default class Renderer {

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    this.previewMesh = false
    this.previewMeshDistance = 5
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

  attach(link) {
    this.body = link.playerBody;
    this.scene = link.world.scene;

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
  }

  /**
   * Sets the mesh to preview building for.
   * @param {THREE.Mesh} [mesh] The preview mesh
   */
  setPreviewMesh(mesh) {
    if(this.previewMesh) this.clearPreviewMesh()
    this.previewMesh = mesh
    this.scene.add(mesh)
  }

  clearPreviewMesh() {
    this.scene.remove(this.previewMesh)
    this.previewMesh = false
  }

  render() {
    this.camera.position.copy(this.body.rigidBody.interpolatedPosition)
    this.camera.quaternion.copy(this.body.lookQuaternion)

    this.renderer.render(this.scene, this.camera);
  }


}