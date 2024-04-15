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

// circular queue thing
class CircularQueue {
  #array; #cursor
  constructor() {
    this.#array = []
    this.#cursor = 0
  }

  /** The number of elements in the queue */
  get size() {
    return this.#array.length
  }

  /** Pushes an element onto the front of the queue with maximum priority.
   * @param {any} element */
  push(element) {
    // insert the new element at the current cursor
    this.#array.splice(this.#cursor, 0, element)
  }

  /** Returns the element with the highest priority and resets its priority.
   * @returns {any} */
  next() {
    const element = this.#array[this.#cursor]
    this.#cursor++ // goes to the next highest priority element, looping around to the start of the array when necessary
    if(this.#cursor > this.#array.length) {
      this.#cursor = 0
    }
    return element
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

export { TwoWayMap, CircularQueue, check }

/**
 * The fraction of a second that 1 update takes. \
 * When converting units such as acceleration to velocity, multiply by this value to account for dividing out a "seconds" unit.
 */
export const DT = 1 / 60
