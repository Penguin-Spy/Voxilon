// Signaling server for starting WebRTC connections
const WebSocket = require('ws')
const express = require('express')
const router = express.Router()

const sessions = {}

// util function to generate a session code
// https://stackoverflow.com/questions/1349404/#1349426
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
const charsN = chars.length;
function makeCode() {
  let result = ""
  for (var i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsN));
  }
  return result;
}


/* --- HTTP session api --- */

// base page
router.get("/", (req, res) => {
  console.log(`[signal] ${req.url}`)
  res.send(`hello! this is the <a href="https://voxilon.ml">voxilon.ml</a> WebRTC signaling server"`)
})
router.get("/new_session", (req, res) => {
  res.redirect("/")
})
router.get("/:code", (req, res) => {
  // todo: send back autogenerated embed page w/ JS redirect
  res.send("woah it's a session")
})

/* --- Websocket signaling server --- */
function tryParseMsg(msg) {
  try {
    return JSON.parse(msg)
  } catch (e) {
    ws.close(1002, "JSON parse error")
    return false
  }
}

function handleHostMessage(ws, data) {
  //console.log(`[${this.code}] HOST → ${data.to} |`, data)

  const client = ws.session.clients[data.to]
  if (!client || client.readyState !== WebSocket.OPEN) {
    ws.close(1002, "Invalid client specified")
    console.warn(`[${ws.code}] host closed due to invalid client specified: \n\t`, data)
    return
  }
  delete data.to // client knows it's to them
  client.send(JSON.stringify(data))
}

function handleClientMessage(ws, data) {
  //console.log(`[${this.code}] ${this.id} → HOST |`, data)

  if (!ws.session.host/* || session.host.readyState !== ws.OPEN*/) { ws.close(1002, "Invalid host") }
  ws.session.host.send(JSON.stringify({
    from: ws.id,
    ...data
  }))
}

const wsServer = new WebSocket.Server({ noServer: true });
// Initalize websocket & add to session
wsServer.on('connection', (ws, code) => {
  if (code === undefined) { // host
    code = makeCode()
    ws.session = sessions[code] = { host: ws, clients: [] }

    ws.on('message', msg => {
      const data = tryParseMsg(msg)
      if (!data) return console.warn(`[${code}] host closed due to JSON parse error: \n\t${msg}`)
      handleHostMessage(ws, data)
    })
    ws.on('close', (close_code, reason) => {
      console.log(`[signal] host of ${code} disconnected: ${close_code} | ${reason}`)
      for (const client of ws.session.clients) {
        client.close(1001, "Host disconnected.")
      }
      delete sessions[code]
    })
    ws.send(`{"type":"hello","join_code":"${code}"}`)

    console.log(`host joined ${code}`)

  } else { // client
    ws.session = sessions[code]
    ws.id = ws.session.clients.push(ws) - 1

    ws.on('message', msg => {
      const data = tryParseMsg(msg)
      if (!data) return console.warn(`[${code}] client #${ws.id} closed due to JSON parse error: \n\t${msg}`)
      handleClientMessage(ws, data)
    })
    ws.send(`{"type":"hello","id":${ws.id}}`)

    console.log(`client #${ws.id} joined ${code}`)
  }
})


const signalUriRegex = /^\/([A-HJ-NP-Z0-9]{5})$/;
exports.upgrade = function(req, sock, head) {
  console.log(`[signal] connection to '${req.url}' on ${new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC' })}`)
  const [join_session, code] = req.url.match(signalUriRegex) || [false, undefined];
  const new_session = req.url === "/new_session"

  if (!join_session && !new_session) {
    // respond with a 400 status so clients don't hang waiting for the response
    sock.end(`HTTP/${req.httpVersion} 400 Bad Request\r\n\r\n`);
    return;
  }
  if (join_session && !sessions[code]) {
    console.log("no session")
    // the host must first create a session
    sock.end(`HTTP/${req.httpVersion} 404 Not Found\r\n\r\nA session was not found with the requested code.`);
    return;
  }

  wsServer.handleUpgrade(req, sock, head, ws => {
    wsServer.emit('connection', ws, code);
  });
};

exports.router = router