import { SEED_RELAYS, getNotes } from './nostr.js'
import { createRelayId, display, getRelayCount } from './view.js'

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

for (const relay of SEED_RELAYS) {
  createRelayId(relay)
  // See https://en.wikipedia.org/wiki/Tf-idf
  let totalTermCount = 0
  termCounts[relay] = {}
  getNotes(relay, ({ id, pubkey, created_at, kind, tags, content, sig }) => {
    if (kind !== 1) {
      throw new Error(`Unexpected kind "${kind}"`)
    }
    const terms = content.split(/\s+/)
    for (let term of terms) {
      if (term.length > 50) {
        continue
      }
      ++totalTermCount
      term = term.toLowerCase()
      if (term in termCounts[relay]) {
        ++termCounts[relay][term]
      } else {
        termCounts[relay][term] = 1
      }
      documentContainsTerm(relay, term)
    }
  }, () => {
    finishedRelays.add(relay)
    for (const r of finishedRelays) {
      // term-frequency by inverse-document-frequency

      const tfIdf = Object.entries(termCounts[r]).map(([term, count]) =>
        [term, (count / totalTermCount) * inverseDocumentFrequency(term)])
      display(r, tfIdf.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([term]) => term).join(' '))
    }
  })
}
