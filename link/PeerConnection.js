// Class to encapsulate the RTCPeerConnection & communication with the signaling server

export default class PeerConnection {
  /**
   * Creates a new PeerConnection that encapsulates the WebRTC negotiation and additional communication with the signaling server.
   * @param {integer?} to   optional int, ID of client this connection is to (for host)
   * @param {WebSocket} ws  WebSocket, for signaling server
   */
  constructor(ws, to) {
    this.pc = new RTCPeerConnection()
    this.ws = ws
    this.to = to

    this.polite = to === undefined // if to isn't given, we're the client, and therefore the polite peer
    this.makingOffer = false;
    this.ignoreOffer = false;

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.signal({ type: "description", content: this.pc.localDescription })
      } catch(err) {
        console.error(err);
      } finally {
        this.makingOffer = false;
      }
    };

    this.pc.onicecandidate = ({ candidate }) => {
      this.signal({ type: "candidate", content: candidate })
    }

    this.ws.addEventListener("message", async (e) => {
      try {
        const data = JSON.parse(e.data)

        // only handle this message if it's from this PeerConnection's client
        if(this.to !== undefined) {
          if(data.from === this.to) {
            console.log(`[DC signal receive:${this.to}]`, data)
          } else {
            console.log(`[DC signal receive:${this.to}] ignoring message to different client '${data.from}'`)
            return
          }
        } else {
          console.log(`[DC signal receive]`, data)
        }

        switch(data.type) {
          case "description":
            const description = data.content
            const offerCollision = (description.type === "offer") &&
              (this.makingOffer || this.pc.signalingState !== "stable");

            this.ignoreOffer = !this.polite && offerCollision;
            if(this.ignoreOffer) { return; }

            await this.pc.setRemoteDescription(description);
            if(description.type === "offer") {
              await this.pc.setLocalDescription();
              this.signal({ type: "description", content: this.pc.localDescription })
            }
            break;

          case "candidate":
            try {
              await this.pc.addIceCandidate(data.content);
            } catch(err) {
              if(!this.ignoreOffer) {
                throw err;
              }
            }
            break;

          default:
            //console.info("[]")
            break;
        }
      } catch(err) {
        console.error(err)
      }
    })

  }

  signal(packet) {
    if(this.to !== undefined) { packet.to = this.to }
    this.ws.send(JSON.stringify(packet));
  }

  createDataChannel(label, options) {
    return this.pc.createDataChannel(label, options)
  }
}
