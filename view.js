/* global $relays */

const relayIds = []
let relayCount = 0

export const getRelayCount = () => relayCount

export function createRelayId (relay) {
  relayIds[relay] = `relay${++relayCount}`
}

export function display (relay, vibe) {
  const id = relayIds[relay]
  const $vibe = document.getElementById(id)
  if ($vibe) {
    $vibe.innerHTML = vibe
  } else {
    $relays.insertAdjacentHTML('beforeend',
            `<tr><th>${relay}</th><td id=${id}>${vibe}</td></tr>`)
  }
}
