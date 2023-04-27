// main menu when first opening game
export default {
  id: "main_menu",
  title: [
    { $: 'h1', content: "Voxilon" },
    { $: 'h2', content: "with THREE.js now!!" },

    {
      $: 'button', content: "Singleplayer",
      class: 'big',
      action: function() {
        //this.forward("singleplayer")
        this.actions.directLink({
          name: "new world"
        })
      }
    }, {
      $: 'button', content: "Multiplayer",
      class: 'big',
      action: function() {
        this.forward("multiplayer")
      }
    }, {
      $: 'button', content: "Settings",
      class: 'big',
      action: function() {
        alert("Settings clicked")
      }
    },

  ],
  singleplayer: [
    { $: 'h2', content: "Singleplayer" },

    {
      $: 'button', class: "big", content: "Create new Universe",
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
      $: 'button', class: "big", content: "Start",
      action: function() {
        this.actions.directLink({
          name: "new world"
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
      $: 'button', class: "big", content: "Join",
      action: function() {
        const gameCode = this.notableNodes.gameCode.value
        const username = this.notableNodes.username.value
        this.actions.networkLink(gameCode, username)
      }
    }, {
      $: 'button', class: "big back", content: "Back",
      action: function() { this.back() }
    }
  ]
}