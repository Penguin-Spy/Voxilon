function $(name, options) {
  const node = document.createElement(name)
  if (typeof options === "string") {
    node.innerHTML = options
  } else {
    for (const opt in options) {
      if (opt === "content") {
        node.innerHTML = options[opt]
      } else if (opt === "click") {
        node.addEventListener('click', options[opt])
      } else {
        node.setAttribute(opt, options[opt])
      }
    }
  }
  return node
}


export default class GUI {
  constructor(parentNode) {
    this.root = parentNode

    this.history = []

    /*const mainMenu = [
      {name: "h1", content: "Voxilon"},
      {name: "h2", content: "The WebRTC Update!"},
      {name: "button", class: "big", content: "Singleplayer", click: () => {
        alert("signleplayer clicked")
      }},
      {name: "button", class: "big", content: "Multiplayer", click: () => {
        alert("Multiplayer clicked")
      }},
      {name: "button", class: "big", content: "Settings", click: () => {
        alert("Settings clicked")
      }}
    ]*/
  }

  // Sets the root node's child, overwriting anything that was there previously
  setRoot(node) {
    return this.root.replaceChildren(node)
  }

  // moves the main view forward in the navigation history
  forward(node) {
    this.history.push(this.root.firstChild)
    this.setRoot(node)
  }

  // moves back one node in the navigation history
  back() {
    this.setRoot(this.history.pop())
  }

  /* --- VIEW CONSTRUCTORS --- */
  // these functions make a node that has some part of a GUI

  // main menu when first opening game
  mainMenu() {
    const main = $("div", {
      id: "mainMenu"
    })
    main.appendChild($("h1", "Voxilon"))
    main.appendChild($("h2", "The WebRTC Update!"))

    main.appendChild($("button", {
      class: "big",
      content: "Singleplayer",
      click: e => this.forward(this.singleplayer())
    }))
    main.appendChild($("br"))
    main.appendChild($("button", {
      class: "big",
      content: "Multiplayer",
      click: e => alert("Multiplayer clicked")
    }))
    main.appendChild($("br"))
    main.appendChild($("button", {
      class: "big",
      content: "Settings",
      click: e => alert("Settings clicked")
    }))

    return main
  }

  singleplayer() {
    const main = $("div", {
      id: "mainMenu"
    })
    main.appendChild($("h2", "Singleplayer"))

    main.appendChild($("button", {
      class: "big",
      content: "Create new Universe",
      click: e => this.forward(this.newUniverse())
    }))
    main.appendChild($("br"))
    main.appendChild($("input", {
      class: "big",
      type: "file",
      accept: ".vox"
    }))
    main.appendChild($("br"))
    main.appendChild($("button", {
      class: "back",
      content: "Back",
      click: e => this.back()
    }))

    return main
  }

  newUniverse() {
    const main = $("div", {
      id: "mainMenu"
    })

    main.appendChild($("h2", "Create new Universe"))
    main.appendChild($("span", "pretend there's sliders 'n stuff here"))
    main.appendChild($("br"))
    main.appendChild($("button", {
      class: "back",
      content: "Back",
      click: e => this.back()
    }))

    return main
  }
}