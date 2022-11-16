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


# how
abstract client <--> server communication Link
- specific methods: link.moveBody(etc...)
- integrated server impl just passes parameters to server/client
- multiplayer impl encodes params into packets, sends via WebRTC, decodes, and passes to server(/client)

this way both the server and client code is identical across singleplayer and multiplayer scenarios
and there's also no overhead of encoding/decoding packets in singleplayer


# world saving/loading
each thing that extends CelestialBody will have a .serialize() method that returns a JSON string
representing the object
each class that extends CelestialBody will also have a static .deserialize() function that creates
a new instance based on the JSON string
the methods will call their superclass's methods too

doesn't have to be JSON string, could actually be any way of representing it. maybe NBT??