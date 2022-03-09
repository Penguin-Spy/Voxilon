meshes = {
  "Cube": {
    name: "Cube",
    vertexPositions: [
      // Front face
      -1.0, -1.0, 1.0,
      1.0, -1.0, 1.0,
      1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0, 1.0, -1.0,
      1.0, 1.0, -1.0,
      1.0, -1.0, -1.0,

      // Top face
      -1.0, 1.0, -1.0,
      -1.0, 1.0, 1.0,
      1.0, 1.0, 1.0,
      1.0, 1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
      1.0, -1.0, -1.0,
      1.0, -1.0, 1.0,
      -1.0, -1.0, 1.0,

      // Right face
      1.0, -1.0, -1.0,
      1.0, 1.0, -1.0,
      1.0, 1.0, 1.0,
      1.0, -1.0, 1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0, 1.0,
      -1.0, 1.0, 1.0,
      -1.0, 1.0, -1.0,
    ],
    vertexIndices: [
      0, 1, 2, 0, 2, 3,    // front
      4, 5, 6, 4, 6, 7,    // back
      8, 9, 10, 8, 10, 11,   // top
      12, 13, 14, 12, 14, 15,   // bottom
      16, 17, 18, 16, 18, 19,   // right
      20, 21, 22, 20, 22, 23,   // left
    ],
    textureCoords: [
      // Front
      0.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      // Back
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Top
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Bottom
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Right
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Left
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ]
  },
  "Sphere": {
    name: "Sphere",
    vertexPositions: [4, 5, 6]
  },
  "Help": {
    name: "Help",
    vertexPositions: [
      // Front face
      0.0, 0.0, 0.0,  // bottom
      0.0, 0.5, 0.5,  // n
      0.5, 0.5, 0.0,  // e
      0.0, 0.5, -0.5,  // s
      -0.5, 0.5, 0.0,  // w
      0.0, 1.0, 0.0, // top
    ],
    vertexIndices: [
      1, 2, 0,
      2, 3, 0,
      3, 4, 0,
      4, 1, 0,
      1, 2, 5,
      2, 3, 5,
      3, 4, 5,
      4, 1, 5
    ],
    textureCoords: [
      // Front
      0.0, 0.0,
      0.0, 0.0,
      1.0, 1.0,
      1.0, 0.0,
      // Back
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Top
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Bottom
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Right
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Left
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ]
  }
}


define([], function() {
  return function Mesh(meshName, texture) {
    // make copy of mesh
    let mesh = JSON.parse(JSON.stringify(meshes[meshName]));
    this.name = mesh.name;
    this.vertexPositions = mesh.vertexPositions
    this.vertexIndices = mesh.vertexIndices
    this.textureCoords = mesh.textureCoords;
    // may be undefined (if on server or client root body)
    this.texture = texture;

    /*this.attach = function(body) {
      this.body = body;
    }*/
  }
})