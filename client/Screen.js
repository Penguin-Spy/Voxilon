/** @typedef {import('client/Client.js').default} Client */

export async function loadTemplateFromPath(path) {
  const template = document.createElement('template')
  const html = await fetch("/client/screens/" + path).then(res => res.text())
  template.innerHTML = html
  return template
}

export async function loadStyleSheetFromPath(path) {
  const stylesheet = new CSSStyleSheet()
  const css = await fetch("/client/screens/" + path).then(res => res.text())
  stylesheet.replace(css)
  return stylesheet
}

const defaultStyle = await loadStyleSheetFromPath("style.css")

export default class Screen {
  /** @type {DocumentFragment} The DocumentFragment currently containing the screen's elements. May be a ShadowRoot */
  content
  /** @type {Record<string, function>} @protected  A mapping of element id to event handler function */
  handlers
  /** @type {Client} */
  client


  /**
   * @param {HTMLTemplateElement?} template The template element to generate this Screen's content from. (Optional for MultiViewScreen's implementation)
   */
  constructor(template) {
    if(template) {
      this.content = template.content.cloneNode(true)
    } else {
      this.content = new DocumentFragment()
    }
    this.eventHandlers = []
  }

  /** Moves this Screen's contents to the shadow root
   * @param {ShadowRoot} shadowRoot
   */
  attach(shadowRoot) {
    shadowRoot.adoptedStyleSheets.push(defaultStyle)
    shadowRoot.replaceChildren(this.content)
    this.content = shadowRoot
  }

  /** Sets the event handlers for this screen's content.
   * @param {Record<string, function>} handlers  A mapping of element id to event handler function
   */
  setEventHandlers(handlers) {
    this.eventHandlers = handlers
  }
  addEventHandler(id, handler) {
    this.eventHandlers[id] = handler
  }

  /** Handles clicking on & pressing enter on elements that may or may not have a handler registered.
   * @param {string} elementID  The ID of the element that was clicked/activated
   * @param {KeyboardEvent|MouseEvent} event  The event that was raised */
  handleClick(elementID, event) {
    const listener = this.eventHandlers[elementID]
    if(listener) {
      try {
        listener.call(this, event)
      } catch(error) {
        Voxilon.showError("Error while running GUI action", error)
      }
    }
  }

  /** Handles navigating with the keyboard
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const activeElement = this.content.activeElement
    let code = event.code
    // recompute this to account for Screens dynamically adding/removing elements
    const focusableNodes = Array.from(this.content.querySelectorAll("a[href], input, select, textarea, button, object"))

    // do arrow keys & enter navigation
    // if nothing's selected, arrows go to 0 and .length
    if(code === "ArrowUp" || code === "ArrowDown" || code === "Enter") {
      let index = focusableNodes.indexOf(activeElement)

      if(code === "Enter") {
        if(index === -1) { // if no element focused, focus the first one
          index = 0
        } else if(activeElement.nodeName === "BUTTON") {
          event.preventDefault()
          this.handleClick(activeElement.id, event)
          return
        } else if(activeElement.nodeName === "A") {
          return // allow default action of event
        } else {
          code = "ArrowDown" // otherwise, go to the next focusable element
        }
        event.preventDefault()
      }
      if(code === "ArrowDown") {
        index++
        if(index >= focusableNodes.length) {
          index = 0
        }
      } else if(code === "ArrowUp") {
        index--
        if(index < 0) {
          index = focusableNodes.length - 1
        }
      }

      focusableNodes[index].focus()
    }
  }

  /** Receives an update message to the player's current Screen
   * @param {string} action The action of the update
   * @param {object} data   Data for the update
   */
  receiveScreenUpdate(action, data) {
    console.warn(`receiveScreenUpdate not implemented for ${this.constructor.name}`)
  }

  close() {
    this.client.setScreen(false)
    // TODO: does this also need to notify the server that the screen closed?
  }
}
