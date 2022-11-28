class GUI {
  constructor(/* parentNode */) {
    const parentNode = document.querySelector("#gui")
    this.root = parentNode
    this.history = []
    this.notableNodes = {} // nodes that have "id" set, usually for accessing in gui scripts

    // Main frame for the currently open screen (inventory, building gui, main menu, etc.)
    this.mainFrame = document.createElement("div")
    this.mainFrame.setAttribute("class", "gui-mainFrame")
    this.root.replaceChildren(this.mainFrame) // this removes the loading/"failed to load" message
  }

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

    // create all elements & put them in this.mainFrame
    for (const element of this.screen[view]) {
      const node = document.createElement(element.$ ?? 'div')

      for (const k in element) {
        switch (k) {
          case "$": break;
          case "content":
            node.innerHTML = element[k]
            break
          case "action":
            node.addEventListener('click', () => {
              element.action.call(this)
            })
            break
          case "id":
            this.notableNodes[element[k]] = node // don't break; so we set the attribute too
          default:
            node.setAttribute(k, element[k])
        }
      }

      // add the node to the main frame
      this.mainFrame.appendChild(node)
    }
  }

  // moves the main view forward in the navigation history
  forward(view) {
    this.history.push(this.mainFrame.dataset.view)
    this.loadView(view)
  }

  // moves back one node in the navigation history
  back() {
    this.loadView(this.history.pop())
  }

}

export default new GUI();