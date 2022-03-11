export default class Player {
  socket
  username
  bodyID

  constructor(socket) {
    this.socket = socket
    this.username = "-1"
    this.bodyID = -1
  }

  setName(username) {
    this.username = username
  }

  bind(bodyID) {
    this.bodyID = bodyID
  }
}