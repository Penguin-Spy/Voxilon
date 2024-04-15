import Input from 'client/Input.js'

const body = document.querySelector("body")

const focusableNodeNames = ["input", 'select', "textarea", "button", "object"]

// uses Function.bind(GUI, node), event is passed as a normal argument
function protectedCallAction(action, event) {
  try {
    action.call(this, event)
  } catch(e) {
    this.showError("Error while running GUI action", e)
  }
}

class GUI {
  constructor() {
    const parentNode = document.querySelector("#gui")
    this.root = parentNode
    this.history = []
    this.notableNodes = {} // nodes that have "id" set, usually for accessing in gui scripts
    this.focusableNodes = [] // nodes that can receive focus

    // Main frame for the currently open screen (inventory, building gui, main menu, etc.)
    this.mainFrame = gui.children[0]
    this.mainFrame.setAttribute("class", "gui-mainFrame")
    this.mainFrame.replaceChildren() // this removes the loading message
  }

  get cursor() { return body.dataset.cursor }
  set cursor(value) { body.dataset.cursor = value }

  get hasScreenOpen() { return this.mainFrame.dataset.screen !== undefined }

  addFrame(frameClass) {
    const frame = document.createElement("div")
    frame.setAttribute("class", frameClass)
    this.root.appendChild(frame)
    return frame
  }

  // sets the current screen & displays the specified view
  // optionally provides the screen the specified actions
  loadScreen(screen, initialView, actions) {
    this.screen = screen
    this.actions = actions
    this.mainFrame.dataset.screen = screen.id
    this.loadView(initialView)
  }

  // removes the current screen from the mainFrame
  clearScreen() {
    this.mainFrame.replaceChildren()
    delete this.mainFrame.dataset.screen
    delete this.mainFrame.dataset.view
  }

  // loads the specified view of the current screen
  // does not modify this.history in any way!
  loadView(view) {
    this.mainFrame.replaceChildren() // remove previous view
    this.mainFrame.dataset.view = view
    this.notableNodes = {}
    this.focusableNodes.length = 0
    this.proceedAction = undefined

    // create all elements & put them in this.mainFrame
    for(const element of this.screen[view]) {
      const node = document.createElement(element.$ ?? 'div')

      for(const k in element) {
        switch(k) {
          case "$": break;
          case "content":
            node.innerHTML = element[k]
            break
          case "action":
            // this = GUI, action = element.action, event is passed as a normal argument
            node.action = protectedCallAction.bind(this, element.action)
            node.addEventListener('click', node.action)
            break
          case "proceedAction":
            this.proceedAction = element.action
            break
          case "id":
            this.notableNodes[element[k]] = node // don't break; so we set the attribute too
          default:
            node.setAttribute(k, element[k])
        }
      }

      // add the node to the main frame
      this.mainFrame.appendChild(node)

      if(focusableNodeNames.includes(element.$)) {
        this.focusableNodes.push(node)
      }
    }

    // focus the first focusable text input in the view
    const firstInput = this.focusableNodes.find(node => node.nodeName === "INPUT" && node.type === "text")
    if(firstInput) { firstInput.focus() }
  }

  // moves the main view forward in the navigation history
  forward(view) {
    this.history.push(this.mainFrame.dataset.view)
    this.loadView(view)
  }

  // moves back one node in the navigation history
  back() {
    if(this.history.length > 0) this.loadView(this.history.pop())
  }

  // when hitting enter in the menu
  proceed(event) {
    if(this.proceedAction) this.proceedAction(event)
  }

  // call action on the notableNode
  runAction(index, event) {
    const action = this.focusableNodes[index].action
    if(action === undefined) return false
    action(event)
    return true
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

export default new GUI();
