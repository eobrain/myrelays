import { nostrWatchRelays, getEvents, closeSockets } from './nostr.js'
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

function updateAll (elapsedMs) {
  for (const relay of finishedRelays) {
    // term-frequency by inverse-document-frequency

    const tfIdf = Object.entries(termCounts[relay]).map(([term, count]) =>
      [term, (count / totalTermCount[relay]) * inverseDocumentFrequency(term)])
    const speed = elapsedMs ? totalTermCount[relay] / elapsedMs : undefined
    display(relay, totalTermCount[relay] / noteCount[relay], speed, tfIdf.sort((a, b) => b[1] - a[1]).slice(0, 20).map(([term]) => term).join(' '))
  }
}

function isUrl (term) {
  try {
    URL(term)
    return true
  } catch (e) {
    return false
  }
}

function getTextNote (relay, content) {
  ++noteCount[relay]
  // const terms = content.split(/[\s【】!()[\]{};'",?]+/)
  const terms = content.split(/\W+/)
  for (let term of terms) {
    if (term.length > 50 || isUrl(term)) {
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

function finish (relay, elapsedMs) {
  if (noteCount[relay] > 0) {
    finishedRelays.add(relay)
    updateAll(elapsedMs)
  }
  activeRelays.delete(relay)
  console.log(`Disconnecting from ${relay}`)
  console.log(activeRelays)
}

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
  try {
    getEvents(relay, [1, 2], ({ /* id, pubkey, created_at, */ kind, /* tags, */ content /*, sig */ }) => {
      try {
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
      } catch (e) {
        finish(relay)
      }
    }, (elapsedMs) => {
      finish(relay, elapsedMs)
    })
  } catch (e) {
    finish(relay)
  }
}

function getRecommendServer (relay, content) {
  if (!content.match(/^wss:\/\//)) {
    return
  }
  connectToRelay(content)
}

// See https://en.wikipedia.org/wiki/Tf-idf
for (const relay of await nostrWatchRelays()) {
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
})
