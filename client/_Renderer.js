define(function() {
  return function Renderer() {
    this.body = null;

    this.gl = null;
    this.canvas = null;

    this.oldInnerWidth = window.innerWidth;
    this.oldInnerHeight = window.innerHeight;

    this.program = null;
    this.vbo = null;

    this.g_eye = null;
    this.g_camUp = null;
    this.g_camRight = null;
    this.g_camForward = null;
    this.bodyPositions = null;

    this.horizontalAngle = 0;
    this.verticalAngle = 0;

    this.getFile = async function(filename) {
      let response = await fetch(filename);

      if (response.ok) { // if HTTP-status is 200-299
        // get the response body (the method explained below)
        return await response.text();
      } else {
        alert("HTTP-Error: " + response.status);
      }
    }

    // Attach this renderer to the specified body
    this.attach = function(body) {
      this.body = body;
    }

    this.initGL = function(canvas) {
  	  var container = document.getElementById("container");
  	  if(!window.WebGLRenderingContext) {
  	  	container.innerHTML = "Unable to initialize <a href=\"http://get.webgl.org\">WebGL</a>. Your browser may not support it.";
  	  }

  	  try { this.gl = canvas.getContext("webgl"); } 
  	  catch(e) { }

  	  if(this.gl == null) {
  	  	try { this.gl = canvas.getContext("experimental-webgl"); }
  	  	catch (e) { 
          this.gl = null;
          alert("WebGL not found.");
        };
  	  }
    }

    this.getShader = async function(gl, id) {
    	//var script = document.getElementById(id);
      var src = await this.getFile("client/webgl/" + id + ".glsl");
    	if(!src) {
        error = "Script " + id + " not found.";
        alert(error);
        return error;
    	}

    	var shader;
    	if(id == "fragment") {
    		shader = gl.createShader(gl.FRAGMENT_SHADER);
    	} else if(id == "vertex") {
    		shader = gl.createShader(gl.VERTEX_SHADER);
    	} else {
    		error = "Unknown script type";
        alert(error);
        return error;
      }

    	gl.shaderSource(shader, src);
    	gl.compileShader(shader);

    	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    		alert("GL shader '" + id + "' compile error: " + gl.getShaderInfoLog(shader));
        return null;
    	}

    	return shader;
    }

    this.initProgram = async function() {
    	var fragmentShader = await this.getShader(this.gl, "fragment");
    	var vertexShader = await this.getShader(this.gl, "vertex");

    	this.program = this.gl.createProgram();


    	this.gl.attachShader(this.program, vertexShader);
    	this.gl.attachShader(this.program, fragmentShader);
    	this.gl.linkProgram(this.program);

    	if(!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
    		alert("Unable to initialize the shader program");
    	}

    	this.gl.useProgram(this.program);

    	var quad = [
    		-1.0, -1.0, 0.0,
    		-1.0,  1.0, 0.0,
    		 1.0, -1.0, 0.0,
    		 1.0,  1.0, 0.0
    	];

    	this.vbo = this.gl.createBuffer();
    	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quad), this.gl.STATIC_DRAW);

    	this.program.positionAttrib = this.gl.getAttribLocation(this.program, "position");
    	this.gl.enableVertexAttribArray(this.program.positionAttrib);
    	this.gl.vertexAttribPointer(this.program.positionAttrib, 3, this.gl.FLOAT, false, 0, 0);

    	this.program.resolutionUniform = this.gl.getUniformLocation(this.program, "g_resolution");
    	this.program.camUpUniform = this.gl.getUniformLocation(this.program, "g_camUp");
    	this.program.camRightUniform = this.gl.getUniformLocation(this.program, "g_camRight");
    	this.program.camForwardUniform = this.gl.getUniformLocation(this.program, "g_camForward");
    	this.program.eyeUniform = this.gl.getUniformLocation(this.program, "g_eye");
    	this.program.bodyPositions = this.gl.getUniformLocation(this.program, "g_bodyPositions");
    }

    this.initCamera = function() {
    	this.g_eye = [0, 1, -2];
    	this.g_camUp = [0, 1, 0];
    	this.g_camRight = [1, 0, 0];
    	this.g_camForward = vec3.create();
    	vec3.cross(this.g_camForward, this.g_camRight, this.g_camUp);
    	vec3.normalize(this.g_camForward, this.g_camForward);
    }

    this.updateCamera = function() {
      this.g_eye = this.body.position;
      this.g_camForward = this.body.quaternion.toMatrix(true)[2];
      this.g_camRight = this.body.quaternion.toMatrix(true)[0];
      this.g_camUp = this.body.quaternion.toMatrix(true)[1];
    }

    this.updateBodies = function() {
      this.bodyPositions = new Float32Array(3*10);
      world.bodies.forEach((body, i) => {
        if(i < 10) {
          this.bodyPositions[i*3 +0] = body.position[0];
          this.bodyPositions[i*3 +1] = body.position[1];
          this.bodyPositions[i*3 +2] = body.position[2];
        }
      });
    }

    this.updateUniforms = function() {
    	this.gl.uniform2f(this.program.resolutionUniform, this.gl.viewportWidth, this.gl.viewportHeight);
      this.gl.uniform3f(this.program.camUpUniform, this.g_camUp[0], this.g_camUp[1], this.g_camUp[2]);
    	this.gl.uniform3f(this.program.camRightUniform, this.g_camRight[0], this.g_camRight[1], this.g_camRight[2]);
    	this.gl.uniform3f(this.program.camForwardUniform, this.g_camForward[0], this.g_camForward[1], this.g_camForward[2]);
    	this.gl.uniform3f(this.program.eyeUniform, this.g_eye[0], this.g_eye[1], this.g_eye[2]);
    	this.gl.uniform3fv(this.program.bodyPositions, this.bodyPositions);
    }

    this.render = function() {
    	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  
      if(window.innerWidth != this.oldInnerWidth ||
         window.innerHeight != this.oldInnerHeight) {
         
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.oldInnerWidth = window.innerWidth;
        this.oldInnerHeight = window.innerHeight;

    	  this.gl.viewportWidth = this.canvas.width;
    	  this.gl.viewportHeight = this.canvas.height;

        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
      }

      this.updateCamera();
      this.updateBodies();
      this.updateUniforms();

    	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    this.init = async function(canvas) {
      this.canvas = canvas;


      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

  	  this.initGL(canvas);

  	  if(this.gl) {
  	  	this.gl.viewportWidth = canvas.width;
  	  	this.gl.viewportHeight = canvas.height;

  	  	await this.initProgram();
  	  	this.initCamera();

  	  	this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
  	  	this.gl.clearColor(0.3, 0.3, 0.3, 1);
  	  }
    }
  }
})