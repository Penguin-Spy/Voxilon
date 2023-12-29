import Input from '/client/Input.js'
import GUI from '/client/GUI.js'

export default class HUD {
  constructor(link) {
    this.link = link
    this.link.on('chat_message', ({ author, msg }) => this.showChatMessage(`<${author}> ${msg}`))

    this.frame = GUI.addFrame("gui-hud")
    this.hide()

    const crosshair = document.createElement("span")
    crosshair.innerText = "()"
    this.frame.appendChild(crosshair)


    const chat = document.createElement('div')
    chat.setAttribute('class', "chat-container")

    this.chatList = document.createElement('div')
    this.chatList.setAttribute('class', 'chat-list')
    this.chatInput = document.createElement('input')
    this.chatInput.hidden = true
    this.chatInput.onkeydown = e => {
      if(e.code === "Enter") {
        this.link.sendChat(this.chatInput.value)
        this.chatInput.value = ""
        this.closeChat()
      }
    }
    chat.appendChild(this.chatList);
    chat.appendChild(this.chatInput);
    this.frame.appendChild(chat)


    this.hotbar = document.createElement('div')
    this.hotbar.setAttribute('class', "hotbar")
    this.frame.appendChild(this.hotbar)
    for(let i = 0; i <= 9; i++) {
      const slot = document.createElement('button')
      slot.setAttribute('class', "hotbar-slot")

      slot.addEventListener('click', () => {
        this.link.activeController.setHotbarSlot(i)
      })

      const img = document.createElement('img')
      slot.appendChild(img)
      this.hotbar.appendChild(slot)
    }


    const statusDisplay = document.createElement('div')
    statusDisplay.setAttribute('class', "status-display bg bg-top bg-left")

    this.jetpackStatus = document.createElement('span')
    this.inertiaStatus = document.createElement('span')
    statusDisplay.appendChild(this.jetpackStatus)
    statusDisplay.appendChild(this.inertiaStatus)
    this.frame.appendChild(statusDisplay)


    Input.on('toggle_chat', () => {
      if(this.chatInput.hidden) {
        this.openChat()
      } else {
        this.closeChat()
      }
    })
  }

  // update elements
  update() {
    if(document.activeElement !== this.chatInput && !this.chatInput.hidden) { this.closeChat() }
  }

  // called by PlayerController when we need to update the status display
  updateStatus(status) {
    this.jetpackStatus.innerText = `Jetpack: ${status.jetpackActive ? "ACTIVE" : "INACTIVE"}`
    this.inertiaStatus.innerText = `Dampeners: ${status.linearDampingActive ? "ACTIVE" : "INACTIVE"}`
  }

  // called by PlayerController when we need to update the hotbar
  updateHotbar(status) {
    const hotbarNodes = this.hotbar.childNodes
    for(let i = 0; i < this.hotbar.childElementCount; i++) {
      hotbarNodes[i].classList.remove("selected")
      const hotbarSlot = status.hotbar[i]
      if(hotbarSlot) {
        //hotbarNodes[i].firstChild.src = `/assets/gui/${hotbarSlot.type}/${hotbarSlot.name}.png`
        hotbarNodes[i].firstChild.src = `/assets/debug.png`
      } else {
        hotbarNodes[i].firstChild.src = `/assets/transparent.png`
      }
    }
    hotbarNodes[status.selectedHotbarSlot].classList.add("selected")
  }

  hide() { this.frame.hidden = true }
  show() { this.frame.hidden = false }

  openChat() {
    this.chatInput.hidden = false
    this.chatInput.focus()
  }
  closeChat() {
    this.chatInput.hidden = true
    this.chatInput.blur() // removes focus from the input, returing it to the body. (great name there guys, super not confusing)
  }

  showChatMessage(msg) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(msg));
    this.chatList.appendChild(span);
    setTimeout(() => {
      this.chatList.removeChild(span)
    }, 10e3)
  }

}
