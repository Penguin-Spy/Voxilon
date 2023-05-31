import { Material, ContactMaterial } from 'cannon';

const contactMaterials = []

export const ground = new Material("ground")
//export const standingPlayer = new Material("standingPlayer")
export const walkingPlayer = new Material("walkingPlayer")


contactMaterials.push(new ContactMaterial(ground, ground, {
  friction: 1,
  restitution: 0.0,
  contactEquationRelaxation: 1000.0,
}))

contactMaterials.push(new ContactMaterial(ground, walkingPlayer, {
  friction: 0,
}))

export { contactMaterials }