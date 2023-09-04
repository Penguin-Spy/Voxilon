import { TextureLoader, NearestFilter, MeshBasicMaterial } from 'three'

const loader = new TextureLoader()
loader.setPath("/assets/")

const tex_debugGrid = loader.load("debug.png")
const tex_debugCompass = loader.load("debug2.png")
const tex_Cube = loader.load("components/cube.png")
tex_debugGrid.magFilter = NearestFilter
tex_debugGrid.generateMipmaps = false
tex_debugCompass.magFilter = NearestFilter
tex_debugCompass.generateMipmaps = false
tex_Cube.magFilter = NearestFilter
tex_Cube.generateMipmaps = false

const tex_grass = loader.load("grass.png")


export const DEBUG_GRID = new MeshBasicMaterial({ map: tex_debugGrid })
export const DEBUG_COMPASS = new MeshBasicMaterial({ map: tex_debugCompass })

export const CUBE = new MeshBasicMaterial({ map: tex_Cube })

export const GRASS = new MeshBasicMaterial({ map: tex_grass })