import { Box3, Vector3 } from 'three'

// https://stackoverflow.com/questions/21070836/#21070876
class TwoWayMap {
  constructor(map) {
    this.map = map;
    this.reverseMap = {};
    for(const key in map) {
      const value = map[key];
      this.reverseMap[value] = key;
    }
  }
  keyToValue(key) { return this.map[key]; } // getValue
  valueToKey(value) { return this.reverseMap[value]; } //getKey
  set(key, value) {
    this.map[key] = value;
    this.reverseMap[value] = key;
  }
}

/**
 * type safety checks during world load
 * @param {any} variable The value to check the type of
 * @param {string|Function} type The expected type string, or a function to check if the variable is the correct type.
 */
function check(variable, type) {
  if(typeof type === "function" && type(variable)) {
    return variable
    /*} else { // we can't give much more info about what didn't match
      throw new TypeError(`Encountered incorrect type when loading; value did not match tester function.`)
    }*/
  } else if(typeof variable === type) {
    return variable
  } else {
    throw new TypeError(`Encountered incorrect type when loading. Expected ${type}, got ${typeof variable}.`)
  }
}

/**
 * Creates an offset THREE.Box3 based on the provided width, depth, and height. \
 * The returned offset is from the center of 0,0,0 to the center of the box.
 * @param {number} width
 * @param {number} depth
 * @param {number} height
 * @returns {[THREE.Box3|THREE.Vector3]}
 */
function boundingBoxFromDimensions(width, depth, height) {
  const box = new Box3(
    new Vector3(0, 0, 0),
    new Vector3(width, depth, height)
  )
  const offset = new Vector3((width - 1) / 2, (depth - 1) / 2, (height - 1) / 2)
  return [box, offset]
}

export { TwoWayMap, check, boundingBoxFromDimensions }