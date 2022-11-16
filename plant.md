# WebRTC:
impolite peer is host of world
polite peers are any clients who are connecting

repl.it just hosts the signaling server, no actual game server
  oh and also the static files i guess


# actual game network stuff
server has authoritative state over the entire game world EXCEPT FOR player's bodies
clients have authoritative state over their own CelestialBody
- this makes position cheating ez but who cares
- gaming experience is smooth & programming is ez


singleplayer:
  - downloads client stuff (always)
  - downloads server stuff
  - runs w/ integrated server

multiplayer:
  - host does exactly what singleplayer does
  - clients just download client stuff
  - clients connect via WebRTC to host, host's integrated server becomes the normal server

dedicated server:
  - just the server stuff
  - clients connect via WebRTC
  - signaling server should be able to handle connecting to a domain instead of a "game code"