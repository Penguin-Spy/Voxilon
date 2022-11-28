
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
  getValue(key) { return this.map[key]; }
  getKey(value) { return this.reverseMap[value]; }
  set(key, value) {
    this.map[key] = value;
    this.reverseMap[value] = key;
  }
}

export { TwoWayMap }