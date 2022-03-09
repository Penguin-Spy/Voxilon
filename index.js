/*var fs = require('fs');
var express = require('express');
var http = require('http');
var ExpressPeerServer = require('peer').ExpressPeerServer;
var WebSocket = require('ws');
var Packet = require('./server/Packet.js');
var Player = require('./server/Player.js');*/

var fs = require('fs')
var path = require('path')
var express = require('express')
var http = require('http')
var Session = require('./server/Session.js')


var app = express();

// Host static client & common files
app.use("/client", express.static("client"));
app.get("/common/:file", async (req, res, next) => {
  let file = await fs.readFile(path.join(__dirname, `common/${req.params.file}.js`))
  console.log(file)
  res.send(file.replace("module.exports", "export"))
})
app.use("/common", express.static("common"));
app.use(express.static("www"));

// Start Servers
var server = http.createServer(app);
//var peerServer = peer.ExpressPeerServer(server);
//app.use('/peerjs', peerServer);

let sessions = {}


// use only our websocket handler (breaks other upgrade requests, don't need them)
server.removeAllListeners('upgrade');
server.on('upgrade', function(req, socket, head) {
  const code = req.url.split("/")[2]
  console.log(`[${code}] Connection on ${new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC' })}`);

  if (!sessions[code]) {
    sessions[code] = new Session(code, () => {
      sessions[code] = undefined
    })
  }
  sessions[code].handleUpgrade(req, socket, head)

});

server.listen(8080, function() {
  console.log("Express server started");
});