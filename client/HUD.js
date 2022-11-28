import Input from '/client/Input.js'
import GUI from '/client/GUI.js'

export default class HUD {
  constructor(input, gui) {
    this.frame = GUI.addFrame("gui-hud")
    this.frame.hidden = true

    const chat = document.createElement('div')
    chat.setAttribute('class', "chat")
    this.frame.appendChild(chat)

    const hotbar = document.createElement('div')
    hotbar.setAttribute('class', "hotbar")
    this.frame.appendChild(hotbar)


  }

  hide() { this.frame.hidden = true }
  show() { this.frame.hidden = false }

  showChatMessage(msg) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(msg));
    span.appendChild(document.createElement('br'));
    this.chat.appendChild(span);
    setTimeout(() => {
      console.log("removing message", span)
      this.chat.removeChild(span)
    }, 10e3)
  }

}