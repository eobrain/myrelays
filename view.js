/* global $relays $freeze $avoid */

const countIds = []
const vibeIds = []
let relayCount = 0

export const getRelayCount = () => relayCount

export function createRelayId (relay) {
  ++relayCount
  vibeIds[relay] = `vibe${relayCount}`
  countIds[relay] = `notes${relayCount}`
}

export function display (relay, count, speed, vibe) {
  count = Math.round(count)
  speed = Math.round(speed * 10)
  const vibeId = vibeIds[relay]
  const countId = countIds[relay]
  const $vibe = document.getElementById(vibeId)
  const $count = document.getElementById(countId)

  const wordsToAvoid = $avoid.value.split(/\W+/).filter(w => w)
  const words = vibe.split(/\W+/).filter(w => w)
  let avoidCount = 0
  for (const word of words) {
    avoidCount += wordsToAvoid.includes(word)
  }
  if ($vibe) {
    $vibe.innerHTML = vibe
    $count.innerHTML = count
  } else {
    $relays.insertAdjacentHTML('beforeend',
      `<tr><th>${relay}</th><td id=${countId}>${count}</td><td>${speed !== undefined ? speed : ''}</td><td>${avoidCount}</td><td id=${vibeId}>${vibe}</td></tr>`)
  }
  sortRelays()
}

export function onFreeze (f) {
  $freeze.onclick = f
}

const score = $row =>
  Number($row.children[2].textContent)

function sortRelays () {
  Array.from($relays.querySelectorAll('tr'))
    .sort(($rowA, $rowB) => score($rowB) - score($rowA))
    .forEach(tr => $relays.appendChild(tr))
}
