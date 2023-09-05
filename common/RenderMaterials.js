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
export const wall_top = new MeshBasicMaterial({ map: loader.load("components/wall_top.png") })
export const wall_bottom = new MeshBasicMaterial({ map: loader.load("components/wall_bottom.png") })
export const wall_left = new MeshBasicMaterial({ map: loader.load("components/wall_left.png") })
export const wall_right = new MeshBasicMaterial({ map: loader.load("components/wall_right.png") })
export const wall_front = new MeshBasicMaterial({ map: loader.load("components/wall_front.png") })
export const wall_back = new MeshBasicMaterial({ map: loader.load("components/wall_back.png") })

const tex_grass = loader.load("grass.png")


export const DEBUG_GRID = new MeshBasicMaterial({ map: tex_debugGrid })
export const DEBUG_COMPASS = new MeshBasicMaterial({ map: tex_debugCompass })

export const CUBE = new MeshBasicMaterial({ map: tex_Cube })

export const GRASS = new MeshBasicMaterial({ map: tex_grass })