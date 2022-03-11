/*var ExpressPeerServer = require('peer').ExpressPeerServer;*/

var fs = require('fs')
var path = require('path')
var express = require('express')
var http = require('http')

var app = express();

// Allows the client module to be imported on the root
// required for relative include paths ('./common/PacketEncoder.mjs') to work on client & server
app.get("/client.mjs", (req, res, next) => {
  req.url = "/client/main.mjs"
  next()
})

// Host static client & common files
app.use("/client", express.static("client"));
app.use("/common", express.static("common"));
app.use(express.static("www"));

// Start Servers
var server = http.createServer(app);
//var peerServer = peer.ExpressPeerServer(server);
//app.use('/peerjs', peerServer);


let sessions = {}
import('./server/Session.mjs').then((module) => {
  const Session = module.default
  
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

})
