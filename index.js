import { SEED_RELAYS, getEvents, closeSockets } from './nostr.js'
import { createRelayId, display, getRelayCount, onFreeze } from './view.js'

const documentsContainingTerm = new Map()
function documentContainsTerm (relay, term) {
  if (documentsContainingTerm.has(term)) {
    documentsContainingTerm.get(term).add(relay)
  } else {
    documentsContainingTerm.set(term, new Set([relay]))
  }
}
const inverseDocumentFrequency = (term) =>
  Math.log(getRelayCount() / documentsContainingTerm.get(term).size)

const finishedRelays = new Set()
const termCounts = {}
const totalTermCount = {}
const noteCount = {}

function updateAll () {
  for (const relay of finishedRelays) {
    // term-frequency by inverse-document-frequency

    const tfIdf = Object.entries(termCounts[relay]).map(([term, count]) =>
      [term, (count / totalTermCount[relay]) * inverseDocumentFrequency(term)])
    display(relay, noteCount[relay], tfIdf.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([term]) => term).join(' '))
  }
}

function getTextNote (relay, content) {
  ++noteCount[relay]
  const terms = content.split(/\W+/)
  for (let term of terms) {
    if (term.length > 50) {
      continue
    }
    ++totalTermCount[relay]
    term = term.toLowerCase()
    if (term in termCounts[relay]) {
      ++termCounts[relay][term]
    } else {
      termCounts[relay][term] = 1
    }
    documentContainsTerm(relay, term)
  }
  updateAll()
}

const knownRelays = new Set()
const activeRelays = new Set()

function connectToRelay (relay) {
  if (knownRelays.has(relay)) {
    return
  }
  activeRelays.add(relay)
  console.log(`Connecting to      ${relay}`)
  console.log(activeRelays)
  knownRelays.add(relay)
  createRelayId(relay)
  totalTermCount[relay] = 0
  noteCount[relay] = 0
  termCounts[relay] = {}
  getEvents(relay, [1, 2], ({ id, pubkey, created_at, kind, tags, content, sig }) => {
    switch (kind) {
      case 1:
        getTextNote(relay, content)
        break
      case 2:
        getRecommendServer(relay, content)
        break
      default:
        throw new Error(`Unexpected kind "${kind}"`)
    }
  }, () => {
    finishedRelays.add(relay)
    updateAll()
    activeRelays.delete(relay)
    console.log(`Disconnecting from ${relay}`)
    console.log(activeRelays)
  })
}

function getRecommendServer (relay, content) {
  connectToRelay(content)
}

// See https://en.wikipedia.org/wiki/Tf-idf
for (const relay of SEED_RELAYS) {
  connectToRelay(relay)
}

onFreeze(() => {
  closeSockets()
  // Remove references to allow for garbage collection
  finishedRelays.clear()
  knownRelays.clear()
  documentsContainingTerm.clear()
  for (const object of [termCounts, totalTermCount, noteCount]) {
    for (const prop of Object.getOwnPropertyNames(object)) {
      delete object[prop]
    }
  }
}
)
