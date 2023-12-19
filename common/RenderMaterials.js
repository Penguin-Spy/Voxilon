import { TextureLoader, NearestFilter, MeshBasicMaterial, SRGBColorSpace } from 'three'

const loader = new TextureLoader()
loader.setPath("/assets/")

// loads a texture & applies default settings
function loadTexture(path) {
  const tex = loader.load(path)
  tex.magFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return tex
}

const tex_debugGrid = loadTexture("debug.png")
const tex_debugCompass = loadTexture("debug2.png")
const tex_Cube = loadTexture("components/cube.png")
export const wall_top = new MeshBasicMaterial({ map: loadTexture("components/wall_top.png") })
export const wall_bottom = new MeshBasicMaterial({ map: loadTexture("components/wall_bottom.png") })
export const wall_left = new MeshBasicMaterial({ map: loadTexture("components/wall_left.png") })
export const wall_right = new MeshBasicMaterial({ map: loadTexture("components/wall_right.png") })
export const wall_front = new MeshBasicMaterial({ map: loadTexture("components/wall_front.png") })
export const wall_back = new MeshBasicMaterial({ map: loadTexture("components/wall_back.png") })

const tex_grass = loadTexture("grass.png")

export const DEBUG_GRID = new MeshBasicMaterial({ map: tex_debugGrid })
export const DEBUG_COMPASS = new MeshBasicMaterial({ map: tex_debugCompass })

export const CUBE = new MeshBasicMaterial({ map: tex_Cube })

export const GRASS = new MeshBasicMaterial({ map: tex_grass })
