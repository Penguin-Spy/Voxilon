/*var fs = require('fs');
var express = require('express');
var http = require('http');
var ExpressPeerServer = require('peer').ExpressPeerServer;
var WebSocket = require('ws');
var Packet = require('./server/Packet.js');
var Player = require('./server/Player.js');*/

var requirejs = require('requirejs');
const path = require('path');

requirejs.config({
  paths: {
    common: path.join(__dirname, 'common'),
    server: path.join(__dirname, 'server'),
    client: path.join(__dirname, 'client')
  },
  nodeRequire: require
});

requirejs(['fs', 'express', 'http', /*'peer',*/ 'server/Session'],
  function(fs, express, http, /*peer,*/ Session) {
    var app = express();

    // Host static client & common files
    app.use("/client", express.static("client"));
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
      console.log(`[${code}] Connection on ${new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC'})}`);
      
      if(!sessions[code]) {
        sessions[code] = new Session(code, () => {
          sessions[code] = undefined
        })
      }
      sessions[code].handleUpgrade(req, socket, head)
      
    });

    server.listen(8080, function() {
      console.log("Express server started");
    });
  });