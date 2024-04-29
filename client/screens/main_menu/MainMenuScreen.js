import { loadTemplateFromPath, loadStyleSheetFromPath } from 'client/Screen.js'
import MultiViewScreen from 'client/MultiViewScreen.js'

const views = {
  title: await loadTemplateFromPath('main_menu/title.html'),
  singleplayer: await loadTemplateFromPath('main_menu/singleplayer.html'),
  new_universe: await loadTemplateFromPath('main_menu/new_universe.html'),
  multiplayer: await loadTemplateFromPath('main_menu/multiplayer.html')
}

const commonStyle = await loadStyleSheetFromPath("main_menu/style.css")

export default class MainMenuScreen extends MultiViewScreen {
  constructor(directLink, networkLink) {
    super(views, commonStyle)
    this.loadView("title")
    this.actions = { directLink, networkLink }
  }

  loadView(view) {
    super.loadView(view)
    switch(view) {
      case "title":
        this.setEventHandlers({
          singleplayer: this.singleplayer,
          multiplayer: this.multiplayer,
          settings: this.settings
        })
        break
      case "singleplayer":
        this.setEventHandlers({
          new_universe: e => this.forward("new_universe"),
          load_from_string: this.load_from_string,
          load_debug_world: this.load_debug_world
        })
        break
      case "new_universe":
        this.setEventHandlers({
          start: this.new_universe_start
        })
        break
      case "multiplayer":
        this.setEventHandlers({
          join: this.multiplayer_join
        })
        break
    }
    this.addEventHandler("back", this.backward)
  }

  singleplayer(e) {
    if(e.shiftKey) {
      this.load_debug_world(e)
    } else {
      this.forward("singleplayer")
    }
  }

  load_from_string(e) {
    let worldData
    try {
      worldData = JSON.parse(this.content.querySelector("#world_data").value)
    } catch(error) {
      console.error("failed to parse world -", error)
      alert("failed to parse world - " + error.message)
      return
    }
    this.actions.directLink(e.target, {
      type: "load",
      data: worldData
    })
  }

  load_debug_world(e) {
    this.actions.directLink(e.target, {
      type: "new",
      name: "Debug World"
    })
  }

  new_universe_start(e) {
    this.actions.directLink(e.target, {
      type: "new",
      name: this.content.querySelector("#world_name").value
    })
  }

  multiplayer(e) {
    this.forward("multiplayer")
    if(e.shiftKey) {
      this.content.querySelector("#game_code").value = "AAAAA"
      this.content.querySelector("#username").value = "Lea"
    }
  }

  multiplayer_join(e) {
    const gameCode = this.content.querySelector("#game_code").value
    const username = this.content.querySelector("#username").value
    this.actions.networkLink(e.target, gameCode, username)
  }

  settings() {
    alert("Settings clicked")
    throw new Error("test error")
  }
}
