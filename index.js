/* global $relays */

function getNotes (relay, callback, eose) {
  const socket = new WebSocket(relay)

  const subscription = `myrelays-${crypto.randomUUID()}`

  // Connection opened
  socket.addEventListener('open', (event) => {
    socket.send(JSON.stringify(['REQ', subscription, {
      // "ids": <a list of event ids or prefixes>,
      // "authors": <a list of pubkeys or prefixes, the pubkey of an event must be one of these>,
      kinds: [1]
      // "#e": <a list of event ids that are referenced in an "e" tag>,
      // "#p": <a list of pubkeys that are referenced in a "p" tag>,
      // "since": <an integer unix timestamp, events must be newer than this to pass>,
      // "until": <an integer unix timestamp, events must be older than this to pass>,
      // "limit": <maximum number of events to be returned in the initial query>
    }]))
  })

  // Listen for messages
  socket.addEventListener('message', (messageJson) => {
    const [first, ...rest] = JSON.parse(messageJson.data)
    switch (first) {
      case 'EVENT': {
        const [receivedSubsription, event] = rest
        if (receivedSubsription !== subscription) {
          throw new Error(`Unexpected subscription "${receivedSubsription}"`)
        }
        callback(event)
        break
      }
      case 'EOSE': {
        const [receivedSubsription] = rest
        if (receivedSubsription !== subscription) {
          throw new Error(`Unexpected subscription "${rest[0]}"`)
        }
        eose()
        break
      }
      case 'NOTICE': {
        const [notice] = rest
        alert(notice)
        break
      }
      default:
        throw new Error(`Unexpected message format "${messageJson}"`)
    }
  })
}

const SEED_RELAYS = [
  'wss://relay.n057r.club',
  'wss://nostramsterdam.vpx.moe',
  'nostr.bitocial.xyz'
]

const relayIds = []
let nextRelayId = 0
function createRelayId (relay) {
  relayIds[relay] = `relay${++nextRelayId}`
}

function display (relay, vibe) {
  $relays.insertAdjacentHTML('beforeend',
    `<tr><th>${relay}</th><td>${vibe}</td></tr>`)
}

for (const relay of SEED_RELAYS) {
  createRelayId(relay)
  // See https://en.wikipedia.org/wiki/Tf-idf
  let totalTermCount = 0
  const termCounts = {}
  getNotes(relay, ({ id, pubkey, created_at, kind, tags, content, sig }) => {
    if (kind !== 1) {
      throw new Error(`Unexpected kind "${kind}"`)
    }
    const terms = content.split(/\s+/)
    for (let term of terms) {
      ++totalTermCount
      term = term.toLowerCase()
      if (term in termCounts) {
        ++termCounts[term]
      } else {
        termCounts[term] = 1
      }
    }
  }, () => {
    const termFrequencies = Object.entries(termCounts).map(([term, count]) => [term, count / totalTermCount]).sort((a, b) => b[1] - a[1])
    display(relay, termFrequencies.slice(0, 100).map(([term]) => term).join(' '))
  })
}
