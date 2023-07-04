/* global $relays $freeze $avoid */

const ids = []
let relayCount = 0

export const getRelayCount = () => relayCount

export function createRelayId (relay) {
  ++relayCount
  ids[relay] = {
    count: `notes${relayCount}`,
    avoid: `avoid${relayCount}`,
    vibe: `vibe${relayCount}`
  }
}

export function display (relay, count, speed, vibe) {
  count = Math.round(count)
  speed = Math.round(speed * 10)
  const id = ids[relay]
  const $vibe = document.getElementById(id.vibe)
  const $count = document.getElementById(id.count)
  const $avoidCount = document.getElementById(id.avoid)

  const wordsToAvoid = $avoid.value.split(/\W+/).filter(w => w)
  const words = vibe.split(/\W+/).filter(w => w)
  let avoidCount = 0
  for (const word of words) {
    avoidCount += wordsToAvoid.includes(word)
  }
  if ($vibe) {
    $count.innerHTML = count
    $avoidCount.innerHTML = avoidCount
    $vibe.innerHTML = vibe
  } else {
    $relays.insertAdjacentHTML('beforeend',
      `<tr>
        <th>${relay}</th>
        <td id=${id.count}>${count}</td>
        <td>${speed !== undefined ? speed : ''}</td>
        <td id=${id.avoid}>${avoidCount}</td>
        <td id=${id.vibe}>${vibe}</td></tr>`)
  }
  sortRelays()
}

export function onFreeze (f) {
  $freeze.onclick = f
}

const cellValue = ($row, index) =>
  Number($row.children[index].textContent)

const speedCellValue = $row => cellValue($row, 2)
const avoidCellValue = $row => cellValue($row, 3)

const score = $row =>
  speedCellValue($row) - 1000 * avoidCellValue($row)

function sortRelays () {
  Array.from($relays.querySelectorAll('tr'))
    .sort(($rowA, $rowB) => score($rowB) - score($rowA))
    .forEach(tr => $relays.appendChild(tr))
}
