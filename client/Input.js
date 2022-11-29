/*
Handles all input for all input methods (keyboard, touch, controller?),
as well as controls rebinding.
Exposes named fields for each type of input, i.e. "Input.forward" instead of "Input.currentKeys[87]"
*/

import { TwoWayMap } from '/common/util.js'
const canvas = document.querySelector("#glCanvas")

// State of all currently pressed keys
const currentKeys = {}

// Object mapping each KeyboardEvent.code to a control type (and vice versa)
const controlMap = new TwoWayMap({
  "KeyW": "forward",
  "KeyS": "backward",
  "KeyA": "left",
  "KeyD": "right",
  "Space": "up",
  "ShiftLeft": "down",
  "KeyZ": "toggle_intertia_damping",
  "Tab": "open_chat",
})

// Mapping of "control" -> function()
const eventHandlers = {}

// Current unbounded X/Y pos of the mouse
let mouseX = 0
let mouseY = 0
// Private variables for tracking touch input
let oldMouseX = 0
let oldMouseY = 0

// oninput = false

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock

// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false)
document.addEventListener('mozpointerlockchange', lockChangeAlert, false)

document.addEventListener('touchstart', handleTouch)
document.addEventListener('touchstop', handleTouch)
document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)


/* EVENT HANDLERS */
function lockChangeAlert() {
  if (document.pointerLockElement === canvas) {
    document.addEventListener("mousemove", handleMouseMove, false)
  } else {
    document.removeEventListener("mousemove", handleMouseMove)
    // this.mouseSpeedX = 0
    // this.mouseSpeedY = 0
  }
}

function handleMouseMove(event) {
  mouseX += event.movementX
  mouseY += event.movementY
}

function handleTouch(event) {
  console.log(event)
  if (event.touches) {
    // this.mouseSpeedX = this.oldTouchX - event.touches[0].pageX;
    // this.mouseSpeedY = this.oldTouchY - event.touches[0].pageY;

    oldTouchX = event.touches[0].pageX;
    oldTouchY = event.touches[0].pageY;

    event.preventDefault()
    //document.getElementById("debug-mouse").innerText = `M XY: ${this.mouseSpeedX},${this.mouseSpeedY}`;
  }
}

function handleKeyDown(event) {
  if (document.activeElement.nodeName === "INPUT") return // re-allow typing in <input>s & ignore typed text
  currentKeys[event.code] = true

  const callback = eventHandlers[controlMap.keyToValue(event.code)]
  if (typeof callback === "function") {
    callback(event)
  }

  // TODO: remove these conditions before production; this is for quick developing only!!
  if (!(event.code === "F5" || (event.code === "KeyI" && event.ctrlKey && event.shiftKey))) {
    event.preventDefault()
  }
}
function handleKeyUp(event) {
  currentKeys[event.code] = false
}

export default {
  enablePointerLock() {
    canvas.addEventListener('click', canvas.requestPointerLock)
  },
  disablePointerLock() {
    canvas.removeEventListener('click', canvas.requestPointerLock)
  },
  requestPointerLock() { canvas.requestPointerLock() },

  mouseDX() {
    const returnVal = mouseX - oldMouseX
    oldMouseX = mouseX
    return returnVal
  },
  mouseDY() {
    const returnVal = mouseY - oldMouseY
    oldMouseY = mouseY
    return returnVal
  },

  get(control) {
    const key = controlMap.valueToKey(control)
    if (key !== undefined) {
      return currentKeys[key]
    } else {
      throw new TypeError(`Invalid control: "${control}"`)
    }
  },

  /*on(control, callback) {
    if (controlMap.valueToKey(control) !== undefined) {
      eventHandlers[control] = callback
    } else {
      throw new TypeError(`Invalid control: "${control}"`)
    }
  }*/
}