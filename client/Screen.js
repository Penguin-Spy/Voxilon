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

  /**
   * @param {HTMLTemplateElement?} template The template element to generate this Screen's content from. (Optional for MultiViewScreen's implementation)
   */
  constructor(template) {
    if(template) {
      this.content = template.content.cloneNode(true)
    } else {
      this.content = new DocumentFragment()
    }
  }

  /** Moves this Screen's contents to the shadow root
   * @param {ShadowRoot} shadowRoot
   */
  attach(shadowRoot) {
    shadowRoot.adoptedStyleSheets.push(defaultStyle)
    shadowRoot.replaceChildren(this.content)
    this.content = shadowRoot
  }

  /** Handles navigating with the keyboard
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const activeElement = this.content.activeElement
    const focusableNodes = Array.from(this.content.querySelectorAll("input, select, textarea, button, object"))
    let code = event.code

    //  do arrow keys & enter navigation
    //    if nothing's selected, arrows go to 0 and .length
    if(code === "ArrowUp" || code === "ArrowDown" || code === "Enter") {
      let index = focusableNodes.indexOf(activeElement)

      if(code === "Enter") {
        event.preventDefault()
        if(index === -1) { // if no element focused, focus the first one
          index = 0
        } else if(activeElement.nodeName === "BUTTON") {
          // TODO: this doesn't pass forward the state of modifier keys (shift, ctrl, etc.) will need to save the event handler function on the element to do this
          activeElement.click() // simulate clicking the button
          return
        } else {
          code = "ArrowDown" // otherwise, go to the next focusable element
        }
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
}
