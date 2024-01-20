/*
Handles all input for all input methods (keyboard, touch, controller?),
as well as controls rebinding.
*/

import { TwoWayMap } from '/common/util.js'
import GUI from '/client/GUI.js'

// State of all currently pressed keys
const currentKeys = {}

// Canvas (to be filled from THREE.js)
let canvas

// Object mapping each KeyboardEvent.code to a control type (and vice versa)
const controlMap = new TwoWayMap({
  "KeyW": "forward",
  "KeyS": "backward",
  "KeyA": "left",
  "KeyD": "right",
  "Space": "up",
  "ShiftLeft": "down",
  "ArrowUp": "pitch_up",
  "ArrowDown": "pitch_down",
  "ArrowLeft": "yaw_left",
  "ArrowRight": "yaw_right",
  "KeyQ": "roll_left",
  "KeyE": "roll_right",

  "KeyZ": "toggle_inertia_damping",
  "KeyX": "toggle_jetpack",
  "KeyC": "toggle_cruise_control",
  "Tab": "toggle_chat",
  "AltLeft": "camera_look", // hold to move the camera around when controlling a contraption

  "Digit1": "hotbar_1",
  "Digit2": "hotbar_2",
  "Digit3": "hotbar_3",
  "Digit4": "hotbar_4",
  "Digit5": "hotbar_5",
  "Digit6": "hotbar_6",
  "Digit7": "hotbar_7",
  "Digit8": "hotbar_8",
  "Digit9": "hotbar_9",
  "Digit0": "hotbar_0",
  "Home": "rotate_pitch_up",
  "End": "rotate_pitch_down",
  "Delete": "rotate_yaw_left",
  "PageDown": "rotate_yaw_right",
  "Insert": "rotate_roll_left",
  "PageUp": "rotate_roll_right",

  "MousePrimary": "build",      // left click
  "MouseSecondary": "interact", // right click
  "MouseAuxiliary": "pick",     // middle click
  //"MouseX1": "",
  //"MouseX2": "",

  "WheelUp": "zoom_in", // deltaY (normal scroll wheels)
  "WheelDown": "zoom_out",
  //"WheelLeft": "",    // deltaX (for 2d scroll wheels)
  //"WheelRight": "",
  //"WheelForward": "", // deltaZ (for 3d scroll wheels i guess)
  //"WheelBack": "",

  "F3": "debug_physics_wireframe",
  "F4": "debug_noclip",
  "F6": "debug_gravity_mode",
  "F2": "debug_save"
})

// Mapping of "control" -> function()
const eventHandlers = {}

// Current unbounded X/Y pos of the mouse
let mouseX = 0
let mouseY = 0
// Private variables for tracking touch input
let oldMouseX = 0
let oldMouseY = 0

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock

// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false)
document.addEventListener('mozpointerlockchange', lockChangeAlert, false)

document.addEventListener('touchstart', handleTouch)
document.addEventListener('touchstop', handleTouch)
document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)
document.addEventListener('mousedown', handleMouseDown)
document.addEventListener('mouseup', handleMouseUp)
document.addEventListener('wheel', handleWheel, { passive: false })


/* EVENT HANDLERS */
function lockChangeAlert() {
  if(document.pointerLockElement === canvas) {
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
  if(event.touches) {
    // this.mouseSpeedX = this.oldTouchX - event.touches[0].pageX;
    // this.mouseSpeedY = this.oldTouchY - event.touches[0].pageY;

    oldTouchX = event.touches[0].pageX;
    oldTouchY = event.touches[0].pageY;

    event.preventDefault()
    //document.getElementById("debug-mouse").innerText = `M XY: ${this.mouseSpeedX},${this.mouseSpeedY}`;
  }
}

// behavior of key events in a gui
function handleGuiKeyDown(event) {
  const activeElement = document.activeElement
  const parent = activeElement.parentNode
  let code = event.code

  // if nothing's selected, do custom enter behavior
  if(parent !== GUI.mainFrame) {
    if(code === "Enter") {
      GUI.proceed(event)
      event.preventDefault()
      return
    }
  }

  // regardless of if something's selected:

  //  do esc
  if(code === "Escape") {
    GUI.back()
    event.preventDefault()
    return

    //  do arrow keys & enter navigation
    //    if nothing's selected, arrows go to 0 and .length
  } else if(code === "ArrowUp" || code === "ArrowDown" || code === "Enter") {
    let index = GUI.focusableNodes.indexOf(activeElement)
    // if index === -1 (no child focused), the index over/underflow code will behave properly still

    if(code === "Enter") {
      event.preventDefault()
      if(GUI.runAction(index, event)) {
        return // if the element had an action that ran, return
      } else {
        console.log("next focusable element")
        code = "ArrowDown" // otherwise, go to the next focusable element
      }
    }
    if(code === "ArrowDown") {
      index++
      if(index >= GUI.focusableNodes.length) {
        index = 0
      }
    } else if(code === "ArrowUp") {
      index--
      if(index < 0) {
        index = GUI.focusableNodes.length - 1
      }
    }

    GUI.focusableNodes[index].focus()
  }
}

// behavior of key events during gameplay
function handleGameKeyDown(event) {
  // re-allow typing in <input>s & ignore typed text
  if(document.activeElement.nodeName === "INPUT" // in <input>
    && event.code !== controlMap.valueToKey("toggle_chat")) { // and not toggling chat
    return
  }

  // handle the key event
  currentKeys[event.code] = true

  const callback = eventHandlers[controlMap.keyToValue(event.code)]
  if(typeof callback === "function") {
    callback(event)
  }

  // TODO: remove these conditions before production; this is for quick developing only!!
  if(!(event.code === "F5" || (event.code === "KeyI" && event.ctrlKey && event.shiftKey) || (event.code == "KeyR" && event.ctrlKey))) {
    event.preventDefault()
  }
}

function handleKeyDown(event) {
  try {
    if(document.pointerLockElement === canvas) {
      handleGameKeyDown(event)
    } else if(GUI.hasScreenOpen) {
      handleGuiKeyDown(event)
    }
  } catch(e) {
    GUI.showError("Error while handling keydown", e)
  }
}

function handleKeyUp(event) {
  if(document.pointerLockElement === canvas) {
    event.preventDefault() // prevent Alt activating the browser menu navigation while in-game
  }
  currentKeys[event.code] = false
}

const mouseButtonMap = ["MousePrimary", "MouseAuxiliary", "MouseSecondary", "MouseX1", "MouseX2"]
function handleMouseDown(event) {
  try {
    if(document.pointerLockElement !== canvas) return;

    const code = mouseButtonMap[event.button]
    currentKeys[code] = true

    const callback = eventHandlers[controlMap.keyToValue(code)]
    if(typeof callback === "function") {
      callback(event)
    }
  } catch(e) {
    GUI.showError("Error while handling mousedown", e)
  }
}
function handleMouseUp(event) {
  currentKeys[mouseButtonMap[event.button]] = false
}

/** @param {WheelEvent} event */
function handleWheel(event) {
  let callback

  // positive delta values are in the direction of the "right-most edge, bottom-most edge, and farthest depth (away from the user) of the document" (https://w3c.github.io/uievents/#dom-wheeleventinit-deltaz)
  if(event.deltaY > 0) {
    callback = eventHandlers[controlMap.keyToValue("WheelDown")]
  } else if(event.deltaY < 0) {
    callback = eventHandlers[controlMap.keyToValue("WheelUp")]
  } else if(event.deltaX > 0) {
    callback = eventHandlers[controlMap.keyToValue("WheelRight")]
  } else if(event.deltaX < 0) {
    callback = eventHandlers[controlMap.keyToValue("WheelLeft")]
  } else if(event.deltaZ > 0) {
    callback = eventHandlers[controlMap.keyToValue("WheelForward")]
  } else if(event.deltaZ < 0) {
    callback = eventHandlers[controlMap.keyToValue("WheelBack")]
  }

  if(typeof callback === "function") {
    callback(event)
    event.preventDefault()
  }
}


export default {
  mouseX, mouseY,
  enablePointerLock() {
    canvas.addEventListener('click', canvas.requestPointerLock)
  },
  disablePointerLock() {
    canvas.removeEventListener('click', canvas.requestPointerLock)
  },
  requestPointerLock() { canvas.requestPointerLock() },

  useCanvas(threeCanvas) {
    canvas = threeCanvas;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock
  },

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
    if(key !== undefined) {
      return currentKeys[key]
    } else {
      throw new TypeError(`Invalid control: "${control}"`)
    }
  },

  on(control, callback) {
    if(controlMap.valueToKey(control) === undefined) {
      throw new TypeError(`Invalid control: "${control}"`)
    }
    if(eventHandlers[control]) {
      throw new Error(`Event handler for control "${control}" already exists!`)
    }
    eventHandlers[control] = callback
  },
  off(control) {
    eventHandlers[control] = undefined
  },

  stop() {
    if(canvas) {
      this.disablePointerLock()
    }
    document.exitPointerLock()

    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('touchstop', handleTouch)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('wheel', handleWheel)
  }
}
