// Signaling server for starting WebRTC connections
const ws = require('ws');

const sessions = {}
/*
sessions = {
  "code": {
    host: ws,              // the first user to connect to this session (creating it)
    clients: [ws, ws, ws]  // identified by index
  }
}

*/


const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', (ws, code) => {
  console.log(`[${code}] Connection on ${new Date().toLocaleString('en-US', { hour12: false, timeZone: 'UTC' })}`);

  let session = sessions[code]
  if (!session) { // session doesn't exist, create it
    session = sessions[code] = {
      host: ws,
      clients: []
    }
    ws.send(`{"type":"debug","content":"you're the host!"}`)

    ws.on('message', msg => {
      let data
      try {
        data = JSON.parse(msg)
      } catch (e) {
        ws.close(1002, "JSON parse error")
        console.warn(`[${code}] host closed due to JSON parse error: \n\t${msg}`)
        return
      }
      console.log(`[${code}] HOST → ${data.to} | ${msg}`)

      const client = session.clients[data.to]
      if (!client || client.readyState !== ws.OPEN) {
        ws.close(1002, "Invalid client specified")
        console.warn(`[${code}] host closed due to invalid client specified: \n\t${msg}`)
        return
      }
      delete data.to // client knows it's to them
      client.send(JSON.stringify(data))
    })

  } else { // session already exists, add this as a client
    const id = session.clients.push(ws) - 1
    ws.send(`{"type":"debug","content":"you're client #${id}"}`)

    ws.on('message', msg => {
      let data
      try {
        data = JSON.parse(msg)
      } catch (e) {
        ws.close(1002, "JSON parse error")
        console.warn(`[${code}] client #${id} closed due to JSON parse error: \n\t${msg}`)
        return
      }
      console.log(`[${code}] ${id} → HOST | ${msg}`)

      if (!session.host || session.host.readyState !== ws.OPEN) { ws.close(1002, "Invalid host") }
      session.host.send(JSON.stringify({
        from: id,
        ...data
      }))
    })

  }
})



const signalUriRegex = /^\/signal\?code=(\w+)$/;
exports.upgrade = function(req, sock, head) {
  const [matched, code] = req.url.match(signalUriRegex) || [false];
  if (!matched) {
    // respond with a 400 status so clients don't hang waiting for the response
    sock.end(`HTTP/${req.httpVersion} 400 Bad Request\r\n\r\n`);
    return;
  }

  wsServer.handleUpgrade(req, sock, head, ws => {
    wsServer.emit('connection', ws, code);
  });
};
