import { Material, ContactMaterial } from 'cannon-es';

const contactMaterials = []

export const GROUND = new Material("GROUND")
export const STANDING_PLAYER = new Material("STANDING_PLAYER")
export const WALKING_PLAYER = new Material("WALKING_PLAYER")


contactMaterials.push(new ContactMaterial(GROUND, GROUND, {
  friction: 1,
}))

contactMaterials.push(new ContactMaterial(GROUND, STANDING_PLAYER, {
  friction: 1,
  restitution: 0.0,
  contactEquationRelaxation: 1000.0,
}))

contactMaterials.push(new ContactMaterial(GROUND, WALKING_PLAYER, {
  friction: 0.25,
  restitution: 0.0,
  contactEquationRelaxation: 1000.0,
}))

export { contactMaterials }