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
  showScreen(screen) {
    screen.attach(this.mainShadowRoot)
    this.mainFrame.dataset.screen = screen.constructor.name
    this.screen = screen
  }

  // removes the current screen from the mainFrame
  clearScreen() {
    this.mainShadowRoot.replaceChildren()
    delete this.mainFrame.dataset.screen
    this.screen = null
  }
}

export default new GUI()
