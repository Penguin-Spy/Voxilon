import * as THREE from 'three';

export default class Renderer {

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth /     window.innerHeight, 0.1, 1000 );

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  resize = (width, height) => {
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

  render = (world) => {
    this.camera.position.copy(this.body.position)
    this.camera.quaternion.copy(this.body.lookQuaternion)
    
    this.renderer.render(world.scene, this.camera);
  }

  attach = (body) => {
    this.body = body;
  }

}