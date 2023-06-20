import { TextureLoader, NearestFilter, MeshBasicMaterial } from 'three'

const loader = new TextureLoader()
loader.setPath("/assets/")

const tex_debugGrid = loader.load("debug.png")
const tex_debugCompass = loader.load("debug2.png")
tex_debugGrid.magFilter = NearestFilter
tex_debugGrid.generateMipmaps = false
tex_debugCompass.magFilter = NearestFilter
tex_debugCompass.generateMipmaps = false

export const debugGrid = new MeshBasicMaterial({ map: tex_debugGrid })
export const debugCompass = new MeshBasicMaterial({ map: tex_debugCompass })