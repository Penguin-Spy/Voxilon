const express = require('express');
const signal = require('./signal.js');
const app = express();
app.use(express.json()); // for parsing application/json

// Pass signal subdomain requests to signal router
app.use((req, res, next) => {
  if (req.subdomains[0] === "signal") {
    signal.router.handle(req, res, next)
  } else next()
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
server.on('upgrade', signal.upgrade);