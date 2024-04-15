import { Material, ContactMaterial } from 'cannon';

const contactMaterials = []

export const GROUND = new Material("GROUND")
export const STANDING_PLAYER = new Material("STANDING_PLAYER")
export const WALKING_PLAYER = new Material("WALKING_PLAYER")


contactMaterials.push(new ContactMaterial(GROUND, GROUND, {
  friction: 0.4,
  restitution: 0.3
}))

contactMaterials.push(new ContactMaterial(GROUND, STANDING_PLAYER, {
  friction: 1,
  restitution: 0.0
}))

contactMaterials.push(new ContactMaterial(GROUND, WALKING_PLAYER, {
  friction: 0.0,
  restitution: 0.0
}))

export { contactMaterials }
