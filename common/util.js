
// https://stackoverflow.com/questions/21070836/#21070876
class TwoWayMap {
  constructor(map) {
    this.map = map;
    this.reverseMap = {};
    for (const key in map) {
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

// type safety checks during world load
function check(variable, type) {
  if(typeof variable === type) {
    return variable;
  } else {
    throw new TypeError(`Encountered incorrect type when loading. Expected ${type}, got ${typeof variable}.`)
  }
}

export { TwoWayMap, check }