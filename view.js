/* global $relays */

const relayIds = []
let relayCount = 0

export const getRelayCount = () => relayCount

export function createRelayId (relay) {
  relayIds[relay] = `relay${++relayCount}`
}

export function display (relay, vibe) {
  $relays.insertAdjacentHTML('beforeend',
    `<tr><th>${relay}</th><td>${vibe}</td></tr>`)
}
