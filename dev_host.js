/* dev_host.js © Penguin_Spy 2023-2024
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import express from 'express'
import { router as signalRouter, upgrade } from './signal.js'
const app = express();
app.use(express.json()); // for parsing application/json

// Pass signal requests to signal router
app.use("/signal", (req, res, next) => {
  signalRouter.handle(req, res, next)
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
const server = app.listen(8080, function () {
  console.log("page hosted at http://localhost:8080")
});
server.on('upgrade', (req, sock, head) => {
  req.url = req.url.slice(7) // remove "/signal" prefix
  upgrade(req, sock, head)
});
