/** @typedef {import('client/Screen.js').default} Screen */

import Input from 'client/Input.js'

const body = document.querySelector("body")

class GUI {
  constructor() {
    const parentNode = document.querySelector("#gui")
    this.root = parentNode
    /** @type {Screen?} */
    this.screen = null

    // Main frame for the currently open screen (inventory, building gui, main menu, etc.)
    this.mainFrame = parentNode.children[0]
    this.mainFrame.setAttribute("class", "gui-mainFrame")
    this.mainFrame.replaceChildren() // this removes the loading message

    this.mainShadowRoot = this.mainFrame.attachShadow({ mode: "open" })
  }

  get cursor() { return body.dataset.cursor }
  set cursor(value) { body.dataset.cursor = value }

  get hasScreenOpen() { return this.screen !== null }

  addFrame(frameClass) {
    const frame = document.createElement("div")
    frame.setAttribute("class", frameClass)
    this.root.appendChild(frame)
    return frame
  }

  /** Displays the given screen
   * @param {Screen} screen
   */
  loadScreen(screen) {
    screen.attach(this.mainShadowRoot)
    this.mainFrame.dataset.screen = screen.constructor.name
    this.screen = screen
    // recreate script elements to run them
    /*for(const script of this.mainShadowRoot.querySelectorAll("script")) {
      const clone = document.createElement("script")
      clone.textContent = script.textContent
      script.replaceWith(clone)
    }*/
  }

  // removes the current screen from the mainFrame
  clearScreen() {
    this.mainShadowRoot.replaceChildren()
    delete this.mainFrame.dataset.screen
    this.screen = null
  }

  // displays an error over the whole screen, stops game.
  // only for use with unhandled/catastrophic errors
  showError(context, e) {
    console.error(context + " -", e)
    this.clearScreen()
    Input.stop()
    Voxilon.stop() // stops animate/step loop - TODO: more graceful stop/showError method in the Link instead

    this.mainFrame.className = "gui-messages"
    this.mainFrame.dataset.screen = "error"
    newMessage(`${context} - ${e.name}: ${e.message}`, "error")
    newMessage(`@ ${e.fileName}:${e.line}:${e.column}`, "stacktrace")

    for(const line of e.stack.split("\n")) {
      newMessage(line, "stacktrace")
      if(line.startsWith("FrameRequestCallback")) {  // don't fill the rest of the screen with the animate callback trace
        newMessage("...", "stacktrace")
        break
      }
    }
  }

  // displays an error in the top left of the screen
  showWarning(warn) {
    console.warn(warn)
  }
}

export default new GUI()
