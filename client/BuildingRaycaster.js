import { Raycaster } from 'three'
import ContraptionBody from 'engine/bodies/ContraptionBody.js'
import CelestialBody from 'engine/bodies/CelestialBody.js'


/**
 * A Raycaster that specifically iterates through buildable objects
 */
export default class BuildingRaycaster extends Raycaster {

  intersectBuildableBodies(bodies, intersects = []) {
    for(let i = 0, l = bodies.length; i < l; i++) {
      //intersectObject(objects[i], this, intersects, recursive);
      const body = bodies[i]
      if(body instanceof ContraptionBody) {
        // TODO: bounding sphere/box checks

        // raycast each component of the one contraption
        const components = body.contraption.components, length = components.length
        for(let j = 0; j < length; j++) {
          components[j].raycast(this, intersects)
        }

      } else if(body instanceof CelestialBody) {
        // TODO: bounding sphere/box checks on the celestial body itself
        // raycast the celestial body
        body.raycast(this, intersects)

        // TODO: bounding sphere/box checks for each contraption
        // raycast each component of each contraption
        const contraptions = body.contraptions, contraptionsLength = contraptions.length
        for(let j = 0; j < contraptionsLength; j++) {
          const components = contraptions[j].components, componentsLength = components.length
          for(let k = 0; k < componentsLength; k++) {
            components[k].raycast(this, intersects)
          }
        }
      }
    }

    intersects.sort(ascSort);
    return intersects;
  }
}

function ascSort(a, b) {
  return a.distance - b.distance;
}
