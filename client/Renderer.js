const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;


const fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

let toMatrix4 = function(a) {
  var b = this.w, c = this.x, d = this.y, e = this.z, f = b * c, g = b * d; b *= e;
  var l = c * c, m = c * d;
  c *= e;
  var n = d * d; d *= e; e *= e;
  return a ?
    [[1 - 2 * (n + e), 2 * (m - b), 2 * (c + g), 0], [2 * (m + b), 1 - 2 * (l + e), 2 * (d - f), 0], [2 * (c - g), 2 * (d + f), 1 - 2 * (l + n), 0], [0, 0, 0, 1]]
    : [1 - 2 * (n + e), 2 * (m - b), 2 * (c + g), 0, 2 * (m + b), 1 - 2 * (l + e), 2 * (d - f), 0, 2 * (c - g), 2 * (d + f), 1 - 2 * (l + n), 0, 0, 0, 0, 1]
}

export default class Renderer {
  /*this.gl;
  this.canvas;
  this.body;
  this.programInfo;*/

  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    this.gl = canvas.getContext("webgl");
    console.log(this.gl);
    if (this.gl == null) {
      alert("webgl getContext failed. ");
    }

    // Clear the canvas
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = this._initShaderProgram(this.gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        //vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        textureCoord: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        uSampler: this.gl.getUniformLocation(shaderProgram, 'uSampler'),
      },
    };

    // load and initalize textures
    //this.texture = this._loadTexture(this.gl, "spirit.jpg");
  }

  resize = (width, height) => {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.gl) {
      this.gl.viewportWidth = width;
      this.gl.viewportHeight = height;
      this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    }
  }

  // Initialize a shader program, so WebGL knows how to draw our data
  _initShaderProgram = (gl, vsSource, fsSource) => {
    const vertexShader = this._loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this._loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  // creates a shader of the given type, uploads the source and
  // compiles it.
  _loadShader = (gl, type, source) => {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // create the vertex buffers and color/texture buffer for a mesh
  _createBuffers = (gl, mesh) => {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array(mesh.vertexPositions), gl.STATIC_DRAW);

    /*const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array(mesh.colors), gl.STATIC_DRAW);*/

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textureCoords),
      gl.STATIC_DRAW);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(mesh.vertexIndices), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      //color: colorBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    };
  }

  _drawScene = (gl, programInfo, bodies) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
      45 * Math.PI / 180, // FOV (in radians)
      gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect ratio
      0.1,      // zNear
      100.0);   // zFar

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);

    bodies.forEach((renderBody) => {
      if (!renderBody.mesh) return;

      // Set the drawing position to the "identity" point, which is
      // the center of the scene.
      const modelViewMatrix = mat4.create();

      // Rotate by body's rotation
      mat4.multiply(modelViewMatrix,
        modelViewMatrix,
        renderBody.quaternion.toMatrix4());
      mat4.invert(modelViewMatrix, modelViewMatrix);

      // Translate by bodies offset from camera
      let thisPos = this.body.position
      let renderPos = renderBody.position
      mat4.translate(modelViewMatrix,
        modelViewMatrix, [
          thisPos.x - renderPos.x,
          thisPos.y - renderPos.y,
          thisPos.z - renderPos.z
        ]);

      // Rotate by camera's rotation
      mat4.multiply(modelViewMatrix,
        modelViewMatrix,
        this.body.quaternion.toMatrix4());

      // invert because reasons
      mat4.invert(modelViewMatrix, modelViewMatrix);


      /*mat4.rotate(modelViewMatrix,    // destination matrix
      modelViewMatrix,        // matrix to rotate
      this.squareRotation,    // amount to rotate in radians
      [0, 0, 1]);             // axis to rotate around (Z)
    mat4.rotate(modelViewMatrix,    // destination matrix
      modelViewMatrix,          // matrix to rotate
      this.squareRotation * .7, // amount to rotate in radians
      [0, 1, 0]);               // axis to rotate around (X)
    mat4.rotate(modelViewMatrix,    // destination matrix
      modelViewMatrix,          // matrix to rotate
      this.squareRotation * .3, // amount to rotate in radians
      [1, 0, 0]);               // axis to rotate around (Y)
    */

      // Here's where we call the routine that builds all the
      // objects we'll be drawing.
      const buffers = this._createBuffers(this.gl, renderBody.mesh);

      // Tell WebGL how to pull out the positions from the position
      // buffer into the vertexPosition attribute.
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3,            // pull out 3 values per iteration
        gl.FLOAT,     // the data in the buffer is 32bit floats
        false,        // don't normalize
        0,            // stride: how many bytes to get from one set of values to the next
        0);           // offset: how many bytes inside the buffer to start from
      gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);

      // Tell WebGL how to pull out the colors from the color buffer
      // into the vertexColor attribute.
      /*gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4, gl.FLOAT,
        false, 0, 0);
      gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);*/

      const num = 2; // every coordinate composed of 2 values
      const type = gl.FLOAT; // the data in the buffer is 32 bit float
      const normalize = false; // don't normalize
      const stride = 0; // how many bytes to get from one set to the next
      const offset = 0; // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.vertexAttribPointer(programInfo.attribLocations.textureCoord,
        2,        // every coordinate composed of 2 values
        gl.FLOAT, // the data in the buffer is 32 bit float
        false,    // don't normalize
        0,        // how many bytes to get from one set to the next
        0         // how many bytes inside the buffer to start from
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

      // Tell WebGL which indices to use to index the vertices
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

      gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

      // Load and bind the mesh's texture
      if (!renderBody.mesh.texture.glTexture) {
        renderBody.mesh.texture.load(gl);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, renderBody.mesh.texture.glTexture);
      gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

      gl.drawElements(gl.TRIANGLES,
        renderBody.mesh.vertexIndices.length,// vertexCount
        gl.UNSIGNED_SHORT,  // vertex type
        0);                 // offset
    });

    // render starfield (this should be a shader but be quiet)
  }

  render = (world, deltaTime) => {

    // Draw the scene
    this._drawScene(this.gl, this.programInfo, world.bodies);

    //this.squareRotation += deltaTime;
  }

  attach = (body) => {
    this.body = body;
  }

}