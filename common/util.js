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
 * type safety checks during deserialization
 * @param {any} variable The value to check the type of
 * @param {string} type The expected type string. Denote arrays with `type[]`, and optional values with `?`
 */
function check(variable, type) {
  if(type.endsWith("?")) {
    if(typeof variable === "undefined") { // data.[whatever] wasn't present so undefined was passed
      return undefined
    }
    type = type.substring(0, type.length - 1)
  }
  if(type.endsWith("[]") && Array.isArray(variable)) {
    // assumes the array is continuous and only contains one type
    if(variable[0] === undefined || typeof variable[0] === type.substring(0, type.length - 2)) {
      return variable
    } else {
      console.error("Full array contents:", variable)
      throw new TypeError(`Encountered incorrect type when loading. Expected ${type}, got array of ${typeof variable[0]}.`)
    }
  } else if(typeof variable === type) {
    return variable
  } else {
    throw new TypeError(`Encountered incorrect type when loading. Expected ${type}, got ${typeof variable}.`)
  }
}

export { TwoWayMap, check }
