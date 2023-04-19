import Quaternion from '/common/Quaternion.js'
import * as THREE from 'three';

function toMatrix4(quat) {
  return Quaternion.prototype.toMatrix4.call(quat)
}

export default class Renderer {

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth /     window.innerHeight, 0.1, 1000 );

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    
this.camera.position.z = 5;

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
    this.camera.position.set(this.body.position.x,
                             this.body.position.y,
                             this.body.position.z)

    this.camera.quaternion.set(this.body.quaternion.x,
                               this.body.quaternion.y,
                               this.body.quaternion.z,
                               this.body.quaternion.w)
    
    this.renderer.render(world.scene, this.camera);
  }

  attach = (body) => {
    this.body = body;
  }

}