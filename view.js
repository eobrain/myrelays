/* global $relays $freeze */

const countIds = []
const vibeIds = []
let relayCount = 0

export const getRelayCount = () => relayCount

export function createRelayId (relay) {
  ++relayCount
  vibeIds[relay] = `vibe${relayCount}`
  countIds[relay] = `notes${relayCount}`
}

export function display (relay, count, vibe) {
  count = Math.round(count)
  const vibeId = vibeIds[relay]
  const countId = countIds[relay]
  const $vibe = document.getElementById(vibeId)
  const $count = document.getElementById(countId)
  if ($vibe) {
    $vibe.innerHTML = vibe
    $count.innerHTML = count
  } else {
    $relays.insertAdjacentHTML('beforeend',
            `<tr><th>${relay}</th><td id=${countId}>${count}</td><td id=${vibeId}>${vibe}</td></tr>`)
  }
}

export function onFreeze (f) {
  $freeze.onclick = f
}
