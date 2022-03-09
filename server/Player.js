define(function() {
  return function Player(socket) {
    this.socket = socket;
    this.username = "null";
    this.bodyID = -1;

    this.setName = function(username) {
      this.username = username;
    }

    this.bind = function(bodyID) {
      this.bodyID = bodyID;
    }
  }
});