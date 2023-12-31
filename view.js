/* global $relays $freeze $avoid */

const WORDS_TO_DISPLAY = 3

const ids = []
let relayCount = 0

export const getRelayCount = () => relayCount

export function createRelayId (relay) {
  ++relayCount
  ids[relay] = {
    avoid: `avoid${relayCount}`,
    vibe: `vibe${relayCount}`
  }
}

export function display (relay, domain, speed, tfIdf) {
  const vibe = tfIdf.sort((a, b) => b[1] - a[1]).slice(0, WORDS_TO_DISPLAY).map(([term]) => term).join(' ')
  const tfIdfDictionary = Object.fromEntries(tfIdf)
  speed = Math.round(speed * 10)
  const id = ids[relay]
  const $vibe = document.getElementById(id.vibe)
  const $avoidScore = document.getElementById(id.avoid)

  const wordsToAvoid = $avoid.value.split(/\W+/).filter(w => w)
  let avoidScore = 0
  if (wordsToAvoid.length > 0) {
    for (const avoidWord of wordsToAvoid) {
      if (avoidWord in tfIdfDictionary) {
        avoidScore += tfIdfDictionary[avoidWord]
      }
    }
    avoidScore = Math.round(100000 * avoidScore / wordsToAvoid.length)
  }
  if ($vibe) {
    $avoidScore.innerHTML = avoidScore
    $vibe.innerHTML = vibe
  } else {
    $relays.insertAdjacentHTML('beforeend',
      `<tr>
        <th><a href="https://nostr.watch/relay/${domain}">${domain}</a></th>
        <td>${speed !== undefined && !Number.isNaN(speed) ? speed : ''}</td>
        <td id=${id.avoid}>${avoidScore}</td>
        <td id=${id.vibe}>${vibe}</td></tr>`)
  }
  sortRelays()
}

const SPEED_COLUMN = 1
const AVOID_COLUMN = 2

export function onFreeze (f) {
  $freeze.onclick = f
}

const cellValue = ($row, index) =>
  Number($row.children[index].textContent)

const speedCellValue = $row => cellValue($row, SPEED_COLUMN)
const avoidCellValue = $row => cellValue($row, AVOID_COLUMN)

const score = $row =>
  Math.log(1 + speedCellValue($row)) / 10 - avoidCellValue($row)

function sortRelays () {
  Array.from($relays.querySelectorAll('tr'))
    .sort(($rowA, $rowB) => score($rowB) - score($rowA))
    .forEach(tr => $relays.appendChild(tr))
}
