define(function() {
  //(event) => {
  //  this.keyDown(event.keyCode);
  //}
  /*document.onkeyup = (event) => {
    this.keyUp(event.keyCode);
  }*/

  return function Input() {
    // Array of all currently pressed keys
    this.currentKeys = {};

    // Current unbounded X/Y pos of the mouse
    this.mouseX = 0;
    this.mouseY = 0;

    // Private variables for tracking touch input
    this._oldMouseX = 0;
    this._oldMouseY = 0;

    this._canvas = null;

    this.bindToCanvas = (canvas) => {
      this._canvas = canvas;

      canvas.requestPointerLock = canvas.requestPointerLock ||
        canvas.mozRequestPointerLock;

      document.exitPointerLock = document.exitPointerLock ||
        document.mozExitPointerLock;

      // Hook pointer lock state change events for different browsers
      document.addEventListener('pointerlockchange', this._lockChangeAlert, false);
      document.addEventListener('mozpointerlockchange', this._lockChangeAlert, false);

      canvas.onclick = () => {
        canvas.requestPointerLock();
      };
      document.touchstart = (event) => {
        console.log(_handleTouch)
        this._handleTouch(event);
      }
      document.touchstop = (event) => {
        console.log(_handleTouch)
        this._handleTouch(event);
      }
      document.onkeydown = (event) => {
        this._keyDown(event.keyCode);
      }
      document.onkeyup = (event) => {
        this._keyUp(event.keyCode);
      }
    }

    // --- EVENT HANDLERS ---
    this._lockChangeAlert = () => {
      if (document.pointerLockElement === this._canvas) {
        document.addEventListener("mousemove", this._handleMouseMove, false);
      } else {
        document.removeEventListener("mousemove", this._handleMouseMove);
        this.mouseSpeedX = 0;
        this.mouseSpeedY = 0;
      }
    }

    this._handleMouseMove = (event) => {
      this.mouseX += event.movementX;
      this.mouseY += event.movementY;
    }

    this._handleTouch = (event) => {
      console.log(event)
      if (event.touches) {
        this.mouseSpeedX = this.oldTouchX - event.touches[0].pageX;
        this.mouseSpeedY = this.oldTouchY - event.touches[0].pageY;

        this.oldTouchX = event.touches[0].pageX;
        this.oldTouchY = event.touches[0].pageY;

        event.preventDefault(),
          document.getElementById("debug-mouse").innerText = `M XY: ${this.mouseSpeedX},${this.mouseSpeedY}`;
      }
    }

    // sets key state, NOT READING
    this._keyDown = (keyCode) => {
      this.currentKeys[keyCode] = true;
    }
    this._keyUp = (keyCode) => {
      this.currentKeys[keyCode] = false;
    }

    // --- READING CURRENT INPUTS ---
    this.mouseDeltaX = () => {
      returnVal = this.mouseX - this._oldMouseX;
      this._oldMouseX = this.mouseX;
      return returnVal;
    }
    this.mouseDeltaY = () => {
      returnVal = this.mouseY - this._oldMouseY;
      this._oldMouseY = this.mouseY;
      return returnVal;
    }
    
    this.forward = (pressed) => {
      if(pressed == null) {
        return this.currentKeys[87];  // W
      }
      this.currentKeys[87] = pressed;
    }
    this.backward = (pressed) => {
      if(pressed == null) {
        return this.currentKeys[83];  // S
      }
      this.currentKeys[83] = pressed;
    }
    this.left = (pressed) => {
      if(pressed == null) {
        return this.currentKeys[65];  // A
      }
      this.currentKeys[65] = pressed;
    }
    this.right = (pressed) => {
      if(pressed == null) {
        return this.currentKeys[68];  // D
      }
      this.currentKeys[68] = pressed;
    }
    this.up = (pressed) => {
      if(pressed == null) {
        return this.currentKeys[32];  // Space
      }
      this.currentKeys[32] = pressed;
    }
    this.down = (pressed) => {
      if(pressed == null) {
        return this.currentKeys[16];  // Shift
      }
      this.currentKeys[16] = pressed;
    }
  }
})