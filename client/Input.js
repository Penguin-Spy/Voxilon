/*
Handles all input for all input methods (keyboard, touch, controller?),
as well as controls rebinding.
Exposes named fields for each type of input, i.e. "Input.forward" instead of "Input.currentKeys[87]"
*/

export default class Input {
  // Array of all currently pressed keys
  #currentKeys = {};
  // Object mapping each control type to a KeyboardEvent.code
  controlMap = {
    forward: "KeyW",
    backward: "KeyS",
    left: "KeyA",
    right: "KeyD",
    up: "Space",
    down: "LeftShift"
  };

  // Current unbounded X/Y pos of the mouse
  mouseX = 0;
  mouseY = 0;

  // Private variables for tracking touch input
  #oldMouseX = 0;
  #oldMouseY = 0;

  #canvas = null;

  
  constructor(canvas) {
    this.#canvas = canvas;

    canvas.requestPointerLock = canvas.requestPointerLock ||
      canvas.mozRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock ||
      document.mozExitPointerLock;

    // Hook pointer lock state change events for different browsers
    document.addEventListener('pointerlockchange', this.#lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', this.#lockChangeAlert, false);

    canvas.addEventListener('click', canvas.requestPointerLock)
    
    document.addEventListener('touchstart', this.#handleTouch)
    document.addEventListener('touchstop', this.#handleTouch)
    document.addEventListener('keydown', this.#handleKeyDown)
    document.addEventListener('keyup', this.#handleKeyUp)


    /* PROXY SHENANIGANS */
  
    // Allows for input.controlMap.forward but not input.controlMap.bruh
    this.controlMap = new Proxy(this.controlMap, {
      set: function (target, prop, value) {
        if(target[prop]) {
          target[prop] = value
        } else {
          throw new ReferenceError(`Unknown control '${prop}' (cannot be set to '${value}')`)
        }
      },
      get: function (target, prop) {
        if(target[prop]) {
          return Reflect.get(...arguments);
        }
        throw new ReferenceError(`Unknown control '${prop}'`)
      }
    })

    // Allows for input["forward"] or input.forward = true
    return new Proxy(this, {
      get: function (target, prop) {
        if(target[prop]) {
          return Reflect.get(...arguments);
        } else if(target.controlMap[prop]) {
          return target.#currentKeys[target.controlMap[prop]] || false
        } else {
          throw new ReferenceError(`Unknown property '${prop}' of Input ${target}`)
        }
      },
      set: function (target, prop, value) {
        if(target[prop]) {
          return Reflect.set(...arguments);
        } else if(target.controlMap[prop]) {
          if(typeof(value) === "boolean") {
            target.#currentKeys[target.controlMap[prop]] = value
          } else {
            throw new TypeError(`Cannot set key '${prop}' of Input ${target} to '${value}'`)
          }
        } else {
          throw new ReferenceError(`Unknown key '${prop}' of Input ${target} (cannot be set to '${value}')`)
        }
      }
    })
  }
  
  /* EVENT HANDLERS */
  #lockChangeAlert = () =>{
    if (document.pointerLockElement === this.#canvas) {
      document.addEventListener("mousemove", this.#handleMouseMove, false);
    } else {
      document.removeEventListener("mousemove", this.#handleMouseMove);
      this.mouseSpeedX = 0;
      this.mouseSpeedY = 0;
    }
  }

  #handleMouseMove(event) {
    this.mouseX += event.movementX;
    this.mouseY += event.movementY;
  }

  #handleTouch(event) {
    console.log(event)
    if (event.touches) {
      this.mouseSpeedX = this.oldTouchX - event.touches[0].pageX;
      this.mouseSpeedY = this.oldTouchY - event.touches[0].pageY;

      this.oldTouchX = event.touches[0].pageX;
      this.oldTouchY = event.touches[0].pageY;

      event.preventDefault()
      document.getElementById("debug-mouse").innerText = `M XY: ${this.mouseSpeedX},${this.mouseSpeedY}`;
    }
  }

  #handleKeyDown = (event) => {
    this.#currentKeys[event.code] = true
  }
  #handleKeyUp = (event) => {
    this.#currentKeys[event.code] = false
  }

  // --- READING CURRENT INPUTS ---
  get mouseDX() {
    returnVal = this.mouseX - this.#oldMouseX;
    this.#oldMouseX = this.mouseX;
    return returnVal;
  }
  get mouseDY() {
    returnVal = this.mouseY - this.#oldMouseY;
    this.#oldMouseY = this.mouseY;
    return returnVal;
  }
}