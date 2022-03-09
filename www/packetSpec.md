e-e-e. e ee e
ok
uh

Packet Specification

|   Name   |   Size  | Description
|---|
|   Type   |  1 Byte | Described below (not all types are valid for all directions)
|   Data   | X Bytes | Rest of the packet's data (varies)

| # | Type | Direction
|---|
| 0 | Connect     | C2S
| 1 | Add Body    | S2C
| 2 | Move Body   | Bi
| 3 | Chat        | Bi
| 4 | Remove Body | S2C
| 5 | Rotate Body | Bi

C2S: Client to server packets
S2C: Server to client packets
Bi:  Bidirectional packets, the C2S versions simply omit the playerID field

Type: 0 (Connect, C2S)

|   Name   |   Size  | Description
|----------|---------|-------------
|  Length  |  1 Byte | Length of the name
| Username | x Bytes | Requested name of the connecting player

Type: 1 (Add Body, S2C)

|   Name   |    Size   | Description
|----------|-----------|-------------
|  bodyID  |  2 Bytes  | ID of the body that is being added
| Position | 3*4 Bytes | Float64Array(3) of XYZ coordinates

Type: 2 (Move Body, Bi)

|   Name   |    Size   | Description
|----------|-----------|-------------
|  bodyID  |  2 Bytes  | ID of the body who's velocity is changing
| Position | 3*4 Bytes | Float64Array(3) of XYZ coordinates
| Velocity | 3*4 Bytes | Float64Array(3) of XYZ velocities

Type: 3 (Chat, Bi)

|   Name  |   Size  | Description
|---------|---------|-------------
|  Length | 2 Bytes | Length of the message
| Message | x Bytes | Message

Type: 4 (Remove Body, S2C)

|   Name   |    Size   | Description
|----------|-----------|-------------
|  bodyID  |  2 Bytes  | ID of the body that is being removes

Type: 5 (Rotate Body, Bi)

|   Name    |    Size   | Description
|-----------|-----------|-------------
|  bodyID   |  2 Bytes  | ID of the body that is being rotate
| quaterion | 4*4 Bytes | Float64Array(4) of WXYZ value of quaterion