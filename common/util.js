
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

export { TwoWayMap, check }