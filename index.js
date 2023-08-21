const express = require('express');
const signal = require('./signal.js');
const app = express();
app.use(express.json()); // for parsing application/json

// Pass signal requests to signal router
app.use("/signal", (req, res, next) => {
  signal.router.handle(req, res, next)
})

// Host static client & common files
app.use("/client", express.static("client"));
app.use("/common", express.static("common"));
app.use("/assets", express.static("assets"));
app.use("/link", express.static("link"));
app.use(express.static("www"));

app.get("/400", (req, res) => {
  res.status(400).send("girl that request makes no sense")
})

// Start server & respond to upgrade requests
const server = app.listen(8080, function() {
  console.log("Express server started")
});
server.on('upgrade', (req, sock, head) => {
  req.url = req.url.slice(7) // remove "/signal" prefix
  signal.upgrade(req, sock, head)
});