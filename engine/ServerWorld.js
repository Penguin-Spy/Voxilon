import Body from 'engine/Body.js'

import World from 'engine/World.js'

export default class ServerWorld extends World {
  constructor(data, link) {
    console.log("constructing server world", data, link)
    super(data)
    this.link = link
    this.isServer = true
  }

  /** Gets the next unique id for a body */
  getNextBodyID() {
    return this.nextBodyID++; // return the value, then increment it
  }

  /** Gets the next unique id for a component */
  getNextComponentID() {
    return this.nextComponentID++; // return the value, then increment it
  }

  /** Joins a player to the world, spawing in a character body if they're new to the world. Returns the player's body
   * @param {Player} player
   * @returns {Body}
   */
  joinPlayer(player) {
    // first try to find a character with matching uuid
    /** @type {CharacterBody} */
    let characterBody = this.activeBodies.find(body => body.player_uuid === player.uuid)
    if(!characterBody) {
      // check character bodies in control seats too
      for(const contraptionBody of this.getAllBodiesByType("voxilon:contraption_body")) {
        for(const component of contraptionBody.contraption.components) {
          if(component.type === "voxilon:control_seat" && component.storedCharacterBody && component.storedCharacterBody.player_uuid === player.uuid) {
            characterBody = component.storedCharacterBody
          }
        }
      }
    }

    /* TODO: this needs to not happen when loading the 2nd ever player in multiplayer
    // otherwise if there's just one character, change it's uuid and return it
    let characterBodies = this.bodies.filter(body => body.type === "voxilon:character_body")
    if(characterBodies.length === 1) {
      characterBody = characterBodies[0]
      console.info(`Changing UUID of singleplayer body from ${characterBody.player_uuid} to ${uuid}`)
      characterBody.player_uuid = uuid
      return characterBody
    }*/

    if(!characterBody) {
      // if characterBody is undefined, a new one must be spawned
      console.log("Spawning in new character for player", player)
      characterBody = this.loadBody({
        type: "voxilon:character_body",
        position: this.spawn_point.toArray(),
        player_uuid: player.uuid
      })
    }

    return characterBody
  }

  /**
   * Loads a Body's serialized form, adds it to the world, and sends a LOAD_BODY packet to all players
   * @param {Object} data         The serialized data
   * @returns {Body}              The loaded body
   */
  loadBody(data) {
    const body = super.loadBody(data)

    if(this.link) {
      // send all players a LOAD_BODY packet
      this.link.sendLoadBody(body)
    }

    return body
  }

  activateBody(body) {
    super.activateBody(body)
    this.netSyncQueue.push(body)
  }
  deactivateBody(body) {
    super.deactivateBody(body)
    this.netSyncQueue.remove(body)
  }
}
