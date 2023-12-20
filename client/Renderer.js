import * as THREE from 'three';

const _color = new THREE.Color()

export default class Renderer {
  #previewMesh = false

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    // debug point visualization
    this.pointPositions = {
      "green": [0, 0, 0],
      "red": [0, 0, 0],
      "blue": [0, 0, 0],
      "yellow": [0, 0, 0]
    }
    const pointColors = []
    _color.setRGB(0, 1, 0)
    _color.toArray(pointColors, 0)
    _color.setRGB(1, 0, 0)
    _color.toArray(pointColors, 3)
    _color.setRGB(0, 0, 1)
    _color.toArray(pointColors, 6)
    _color.setRGB(1, 1, 0)
    _color.toArray(pointColors, 9)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(pointColors, 3))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        alphaTest: { value: 0.9 }
      },
      vertexShader: `
			attribute vec3 customColor;

			varying vec3 vColor;

			void main() {
				vColor = customColor;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = 300.0 / -mvPosition.z;

				gl_Position = projectionMatrix * mvPosition;
			}
`,
      fragmentShader: `
			uniform vec3 color;
			uniform float alphaTest;

			varying vec3 vColor;

			void main() {
				gl_FragColor = vec4( color * vColor, 1.0 );

				if ( gl_FragColor.a < alphaTest ) discard;
			}`
    })

    this.points = new THREE.Points(geometry, material)
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

    this.scene.add(this.points)
  }

  /**
   * @param {"green"|"red"|"blue"|"yellow"} name
   * @param {THREE.Vector3} pos
   */
  setPointPosition(name, pos) {
    this.pointPositions[name] = pos.toArray()
    const pointNames = Object.keys(Voxilon.renderer.pointPositions)

    const posArray = new Float32Array(pointNames.length * 3)
    let i = 0
    for(const pointName of pointNames) {
      const point = this.pointPositions[pointName]
      posArray[i] = point[0]
      posArray[i + 1] = point[1]
      posArray[i + 2] = point[2]
      i += 3
    }

    this.points.geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
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
    this.camera.position.copy(this.body.rigidBody.interpolatedPosition)
    this.camera.quaternion.copy(this.body.lookQuaternion)

    this.renderer.render(this.scene, this.camera);
  }


}
