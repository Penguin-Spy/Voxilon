/*
this.world = our object that stores CelestialBodies
wsServer = web socket server for this session's url
*/

import ws from 'ws'
import PacketDecoder from '../common/PacketDecoder.js'
import PacketEncoder from '../common/PacketEncoder.js'
import Player from '../server/Player.js'
import World from '../server/World.js'
import CelestialBody from '../common/CelestialBody.js'

export default class Session {
  #world
  #wsServer
  #players
  code
  close

  constructor(code, close) {
    this.code = code
    this.close = close
    this.players = []
    this.wsServer = new ws.Server({ clientTracking: false, noServer: true })
    this.wsServer.on('connection', this.#onConnect)
    this.world = new World({
      moveBody: (...args) => {
        this.broadcastPacket(PacketEncoder.moveBody(...args), false, args[0])  // bodyID
      },
      rotateBody: (...args) => {
        this.broadcastPacket(PacketEncoder.rotateBody(...args), false, args[0])
      }
    })
    this.world.addBody({ x: 0, y: 0, z: 0 }, { w: 0, x: 0, y: 0, z: 0 }, "Cube", "debug2.png")

  }


  broadcastPacket = (packet, excludePlayer, excludeBodyID) => {
    this.players.forEach(p => {
      if ((p != excludePlayer) && (p.bodyID != excludeBodyID)) {
        p.socket.send(packet);
      }
    })
  }

  // handle upgrade
  handleUpgrade(req, socket, head) {
    this.wsServer.handleUpgrade(req, socket, head, (ws) => {
      this.wsServer.emit('connection', ws, req)
    })
  }

  // handle connect
  #onConnect = (socket) => {
    const player = new Player(socket)
    this.players.push(player);

    socket.session = this;
    socket.player = player;

    // When you receive a message, send that message to every socket.
    socket.on('message', this.#onMessage)

    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', this.#onClose)
  }

  // handle message
  #onMessage = function(data) {
    let broadcastPacket = null; // The packet to broadcast to every other socket
    let returnPacket = null;   // The packet to return back to the sending socket
    const session = this.session;

    if (data instanceof Buffer) {
      //console.log(data)

      let arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      let decodedPacket = PacketDecoder.decode(arrayBuffer);

      switch (decodedPacket.type) {
        // this runs n+1 times for a new player (1st = once, 2nd = twice, 3rd = thrice)
        case "connect":
          // Set the name of the connecting player
          this.player.setName(PacketEncoder.sanitizeInput(decodedPacket.username));

          const texture = ((session.world.bodies.length % 2) == 0) ? "debug.png" : "debug2.png"

          // Add a body for the connecting player
          const bodyID = session.world.addBody({ x: 0, y: 3, z: 4 }, { w: 0, x: 0, y: 0, z: 0 }, "Cube", texture, true);
          this.player.bind(bodyID); // Set the body as this players body

          console.log(`\t player ${decodedPacket.username} w/ tex ${texture} & body #${bodyID}`)

          // Tell all other clients about this new body
          broadcastPacket = PacketEncoder.addBody(bodyID, session.world.getBody(bodyID));
          // Tell the connecting client about all other bodies
          session.world.bodies.forEach((body, i) => {
            this.send(PacketEncoder.addBody(i, body, i == bodyID));
            if (i != bodyID) {
              console.log(`sending body #${i} to ${this.player.username}`)
            } else {  // Send a bodyID of 0 for this players body (signal we're talking about "your" body)
              console.log(`sending body #${i} as ${this.player.username}'s body`)
            }
          })
          break;
        case "moveBody":
          session.world.moveBody(this.player.bodyID, decodedPacket.position, decodedPacket.velocity);
          broadcastPacket = PacketEncoder.moveBody(this.player.bodyID, decodedPacket.position, decodedPacket.velocity);
          break;
        case "chat":
          // Sanitize the input (again; its done on the client too because [see below if statment])
          let message = decodedPacket.message//PacketEncoder.sanitizeInput(decodedPacket.message, false);
          if (message != decodedPacket.message) { // The client did not sanitize the message
            this.send(PacketEncoder.chat("[Server] Nice try."));
          }

          if (message.startsWith("/")) {
            let result = false
            let command = message.substring(1).split(" ")
            console.log(`[${session.code}]: ${this.player.username} /${command}`);
            switch (command[0]) {
              case "push":
                if (command[1] == undefined) {
                  result = "must specify body ID"
                  break;
                }
                let vec = { x: 5, y: 500, z: -3 }
                if (!isNaN(parseFloat(command[2])) && !isNaN(parseFloat(command[3])) && !isNaN(parseFloat(command[4]))
                ) {
                  vec = {
                    x: parseFloat(command[2]),
                    y: parseFloat(command[3]),
                    z: parseFloat(command[4])
                  }
                }
                let body = session.world.getBody(command[1])
                if (body == undefined) {
                  result = "unknown body"
                  break
                }
                body.rigidBody.applyForce(vec)
                break;
              case "dump":
                switch (command[1]) {
                  case "bodies":
                    session.world.bodies.forEach((body, id) => {
                      result += `${id}:\n\t(${body.position.x},${body.position.y},${body.position.z})\n\t(${body.quaternion.x},${body.quaternion.y},${body.quaternion.z},${body.quaternion.w})<br>`
                    })
                    break;
                  default:
                    result = "unknown dump target"
                }
                break;
              case "setpos": {
                if (command[1] == undefined) {
                  result = "must specify body ID"
                  break;
                }
                if (isNaN(parseFloat(command[2])) || isNaN(parseFloat(command[3])) || isNaN(parseFloat(command[4]))) {
                  result = "invalid pos"
                  break
                }
                let body = session.world.getBody(command[1])
                if (body == undefined) {
                  result = "unknown body"
                  break
                }
                body.position = {
                  x: parseFloat(command[2]),
                  y: parseFloat(command[3]),
                  z: parseFloat(command[4])
                }
                console.log(body.rigidBody.position.x)
              }
                break;
              default:
                result = "Unknown command"
            }
            if (result) {
              returnPacket = PacketEncoder.chat(`[Server] ${result}`);
              console.log(`\t${result}`)
            }
          } else {
            console.log(`[${session.code}]: <${this.player.username}> ${message}`);
            message = `<${this.player.username}> ${message}`;

            broadcastPacket = PacketEncoder.chat(message);
            returnPacket = broadcastPacket;
          }
          break;
        case "rotateBody":
          session.world.rotateBody(this.player.bodyID, decodedPacket.quaternion, decodedPacket.angularVelocity);
          broadcastPacket = PacketEncoder.rotateBody(this.player.bodyID, decodedPacket.quaternion, decodedPacket.angularVelocity);
          break;
        default:
          // in the future this should inform the client (and perhaps the player)
          //  instead of just silently erroring
          console.log(`[Error]: Unknown RECIEVE packet type: ${decodedPacket.typeBytes}\n\t\t Data: ${arrayBuffer}`)
      }
    } else {
      console.log(`[Error]: Packet not received as Buffer: ${data}`);
    }

    if (broadcastPacket != null) {
      session.broadcastPacket(broadcastPacket, this.player)
    }
    if (returnPacket != null) {
      this.send(returnPacket);
    }
  }

  // handle disconnect
  #onClose = function() {
    const removePacket = PacketEncoder.removeBody(this.player.bodyID);

    console.log(`[${this.session.code}] ${this.player.username} disconnected`)

    // broadcast a removeBody packet & remove the body from our this.world
    this.session.players = this.session.players.filter(p => p !== this.player);
    if (this.session.players.length == 0) {
      console.log(`Session ${this.session.code} closing`)
      this.session.world.close()
      this.session.close()
      //clearTimeout(this.session.tickTimeout)
    }

    this.session.broadcastPacket(removePacket)

    this.session.world.removeBody(this.player.bodyID);
  }
}