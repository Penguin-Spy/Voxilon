import { TextureLoader, NearestFilter, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace } from 'three'

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
export const wall_top = new MeshStandardMaterial({ map: loadTexture("components/wall_top.png") })
export const wall_bottom = new MeshStandardMaterial({ map: loadTexture("components/wall_bottom.png") })
export const wall_left = new MeshStandardMaterial({ map: loadTexture("components/wall_left.png") })
export const wall_right = new MeshStandardMaterial({ map: loadTexture("components/wall_right.png") })
export const wall_front = new MeshStandardMaterial({ map: loadTexture("components/wall_front.png") })
export const wall_back = new MeshStandardMaterial({ map: loadTexture("components/wall_back.png") })

const tex_grass = loadTexture("grass.png")

export const DEBUG_GRID = new MeshStandardMaterial({ map: tex_debugGrid })
export const DEBUG_COMPASS = new MeshStandardMaterial({ map: tex_debugCompass })

export const CUBE = new MeshStandardMaterial({ map: tex_Cube })

export const GRASS = new MeshStandardMaterial({ map: tex_grass })
