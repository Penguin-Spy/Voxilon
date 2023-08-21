// main menu when first opening game
export default {
  id: "main_menu",
  title: [
    { $: 'h1', content: "Voxilon" },
    { $: 'h2', content: "with THREE.js now!!" },

    {
      $: 'button', content: "Singleplayer",
      class: 'big', id: "startButton", proceedAction: true,
      action: function(e) {
        if(e.shiftKey) {
          this.actions.directLink(this.notableNodes.startButton, {
            name: "Debug World"
          })
        } else {
          this.forward("singleplayer")
        }
      }
    }, {
      $: 'button', content: "Multiplayer",
      class: 'big',
      action: function(e) {
        this.forward("multiplayer")
        if(e.shiftKey) {
          this.notableNodes.gameCode.value = "AAAAA"
          this.notableNodes.username.value = "Lea"
        }
      }
    }, {
      $: 'button', content: "Settings",
      class: 'big',
      action: function() {
        alert("Settings clicked")
        throw new Error("test error")
      }
    },

  ],
  singleplayer: [
    { $: 'h2', content: "Singleplayer" },

    {
      $: 'button', content: "Create new Universe",
      class: "big", proceedAction: true,
      action: function() {
        this.forward("new_universe")
      }
    }, {
      $: 'input', class: "big",
      type: "file", accept: ".vox"
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function() { this.back() }
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
      action: function() {
        this.actions.directLink(this.notableNodes.startButton, {
          name: this.notableNodes.worldName.value
        })
      }
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function() { this.back() }
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
      action: function() {
        const gameCode = this.notableNodes.gameCode.value
        const username = this.notableNodes.username.value
        this.actions.networkLink(this.notableNodes.startButton, gameCode, username)
      }
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function() { this.back() }
    }
  ]
}