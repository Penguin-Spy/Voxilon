// main menu when first opening game
export default {
  id: "main_menu",
  title: [
    { $: 'h1', content: "Voxilon" },
    { $: 'h2', content: "with THREE.js now!!" },

    {
      $: 'button', content: "Singleplayer",
      class: 'big', id: "startButton", proceedAction: true,
      action: function (e) {
        if(e.shiftKey) {
          this.actions.directLink(this.notableNodes.startButton, {
            type: "new",
            name: "Debug World"
          })
        } else {
          this.forward("singleplayer")
        }
      }
    }, {
      $: 'button', content: "Multiplayer",
      class: 'big',
      action: function (e) {
        this.forward("multiplayer")
        if(e.shiftKey) {
          this.notableNodes.gameCode.value = "AAAAA"
          this.notableNodes.username.value = "Lea"
        }
      }
    }, {
      $: 'button', content: "Settings",
      class: 'big',
      action: function () {
        alert("Settings clicked")
        throw new Error("test error")
      }
    },

    { $: 'span', content: "alpha-10_1", class: 'version' },
    {
      $: 'a', content: "view source", class: 'source',
      href: "https://github.com/Penguin-Spy/Voxilon", target: '_blank'
    }
  ],
  singleplayer: [
    { $: 'h2', content: "Singleplayer" },

    {
      $: 'button', content: "Create new Universe",
      class: "big",
      action: function () {
        this.forward("new_universe")
      }
    }, {
      $: 'input', class: "big", id: "worldData",
      type: "text", placeholder: `{"VERSION":"alpha_1","bodies":[...]}`
    }, {
      $: 'button', content: "load from string ↑", id: "loadFromStringButton",
      class: "big", proceedAction: true,
      action: function () {
        let worldData
        try {
          worldData = JSON.parse(this.notableNodes.worldData.value)
        } catch(e) {
          console.error("failed to parse world -", e)
          alert("failed to parse world - " + e.message)
          return
        }
        this.actions.directLink(this.notableNodes.loadFromStringButton, {
          type: "load",
          data: worldData
        })
      }
    }, {
      $: 'button', content: "load debug world",
      class: 'big', id: "loadDebugWorldButton", proceedAction: true,
      action: function (e) {
        this.actions.directLink(this.notableNodes.loadDebugWorldButton, {
          type: "new",
          name: "Debug World"
        })
      }
    }, {
      $: 'input', class: "big",
      type: "file", accept: ".vox"
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function () { this.back() }
    }
  ],
  new_universe: [
    { $: 'h2', content: "Create new Universe" },
    { $: 'span', content: "pretend there's sliders 'n stuff here" },

    {
      $: 'input', class: "big", id: "worldName",
      type: "text", placeholder: "universe name"
    },
    {
      $: 'button', content: "Start",
      class: "big", id: "startButton", proceedAction: true,
      action: function () {
        this.actions.directLink(this.notableNodes.startButton, {
          type: "new",
          name: this.notableNodes.worldName.value
        })
      }
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function () { this.back() }
    }
  ],
  multiplayer: [
    { $: 'h2', content: "Multiplayer" },

    {
      $: 'input', class: "big", id: "gameCode",
      type: "text", placeholder: "game code"
    }, {
      $: 'input', class: "big", id: "username",
      type: "text", placeholder: "username"
    }, {
      $: 'button', content: "Join",
      class: "big", id: "startButton", proceedAction: true,
      action: function () {
        const gameCode = this.notableNodes.gameCode.value
        const username = this.notableNodes.username.value
        this.actions.networkLink(this.notableNodes.startButton, gameCode, username)
      }
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function () { this.back() }
    }
  ]
}
