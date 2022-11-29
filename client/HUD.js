import Input from '/client/Input.js'
import GUI from '/client/GUI.js'

export default class HUD {
  constructor() {
    this.frame = GUI.addFrame("gui-hud")
    this.frame.hidden = true


    const chat = document.createElement('div')
    chat.setAttribute('class', "chat-container")

    this.chatList = document.createElement('div')

    this.chatInput = document.createElement('input')
    this.chatInput.hidden = true
    this.chatInput.onkeydown = e => {
      if (e.code === "Enter") {
        this.link.sendChat(this.chatInput.value)
        this.chatInput.value = ""
        this.closeChat()
      }
    }

    chat.appendChild(this.chatList);
    chat.appendChild(this.chatInput);
    this.frame.appendChild(chat)


    const hotbar = document.createElement('div')
    hotbar.setAttribute('class', "hotbar")
    this.frame.appendChild(hotbar)
  }

  attach(playerController, link) {
    this.playerController = playerController
    this.link = link
    this.link.on('chat_message', ({ author, msg }) => this.showChatMessage(author, msg))
  }

  // get values of stuff from playercontroller & update elements
  update() {
    if (Input.get('open_chat') && this.chatInput.hidden) { this.openChat() }
  }

  hide() { this.frame.hidden = true }
  show() { this.frame.hidden = false }

  openChat() {
    this.chatInput.hidden = false
    this.chatInput.focus()
  }
  closeChat() {
    this.chatInput.hidden = true
    this.chatInput.blur() // removes focus from the input. (great name there guys, super not confusing)
  }

  showChatMessage(author, msg) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(`<${author}> ${msg}`));
    span.appendChild(document.createElement('br'));
    this.chatList.appendChild(span);
    setTimeout(() => {
      console.log("removing message", span)
      this.chatList.removeChild(span)
    }, 10e3)
  }

}