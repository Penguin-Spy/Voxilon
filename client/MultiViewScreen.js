import Screen from 'client/Screen.js'

export default class MultiViewScreen extends Screen {
  /**
   * @param {Record<string, HTMLTemplateElement} views
   * @param {CSSStyleSheet} commonStyle
   */
  constructor(views, commonStyle) {
    super()
    this.views = views
    this.history = []
    this.commonStyle = commonStyle
  }

  /** @param {ShadowRoot} shadowRoot */
  attach(shadowRoot) {
    super.attach(shadowRoot)
    shadowRoot.adoptedStyleSheets.push(this.commonStyle)
  }

  /** Handles navigating with the keyboard
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    // do esc & normal navigation keys
    if(event.code === "Escape" || event.code === "Backspace") {
      event.preventDefault()
      this.backward()
      return
    } else {
      super.handleKeyDown(event)
    }
  }

  loadView(view) {
    const content = this.views[view].content.cloneNode(true)
    this.content.replaceChildren(content)
    this.currentView = view
    const firstInput = this.content.querySelector("input[type=text]")
    if(firstInput) firstInput.focus()
  }

  forward(view) {
    this.history.push(this.currentView)
    this.loadView(view)
  }

  backward() {
    if(this.history.length > 0) {
      this.loadView(this.history.pop())
    }
  }
}
