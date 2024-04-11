const URL_SCHEME_REGEX = /^[a-z][a-z0-9+\-.]*\:/i
const JOIN_CODE_REGEX = /^([A-HJ-NP-Z0-9]{5})$/
const SIGNAL_ENDPOINT = new URL("/signal", document.location)

/**
 * Parses a URL string and converts it to a URL object that is valid to attempt a WebSocket connection to.
 * @param {string} url
 * @returns {URL}
 */
function normalizeSignalURL(url) {
  try {
    // if no scheme is given, assume secure WebSocket
    if(!url.match(URL_SCHEME_REGEX)) {
      url = `wss:${url}`
    }

    // parse the url (URL constructor is allowed to throw an error)
    const targetURL = new URL(url)

    // convert http & https schemes to ws & wss respectively
    if(targetURL.protocol === "http:") { targetURL.protocol = "ws:" }
    if(targetURL.protocol === "https:") { targetURL.protocol = "wss:" }

    // websockets ignore the hash. clean it here for clarity
    targetURL.hash = ""

    return targetURL

  } catch(e) {
    throw new Error(`Failed to validate signal URL: '${url}'`, { cause: e })
  }
}

/**
 * Parses a multiplayer join target: either a published game session's join code, or a URL of a dedicated multiplayer server('s signaling server).
 * Converts it to a URL object that is valid to attempt a WebSocket connection to.
 * @param {string} target
 * @returns {URL}
 */
export function parseSignalTarget(target) {
  if(target.match(JOIN_CODE_REGEX)) { // convert join code to full url
    console.log(`prefixing ${target}`)
    target = `${SIGNAL_ENDPOINT}/${target}`
  }
  return normalizeSignalURL(target)
}

/** The URL to open a WebSocket connection with to create a new game session on the signaling server. */
export const sessionPublishURL = normalizeSignalURL(`${SIGNAL_ENDPOINT}/new_session`)
