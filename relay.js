const cache = new Map()

const headers = { Accept: 'application/nostr+json' }

/** Return NIP-11 metadata about relay. https://github.com/nostr-protocol/nips/blob/master/11.md */
export function metadata (domain) {
  if (!cache.has(domain)) {
    cache.set(domain, { description: '(pending)', supportedNips: [] })
    fetch(`https://${domain}`, { headers }).then(req => {
      req.json().then(json => {
        const { description, supported_nips: supportedNips } = json
        cache.set(domain, { description, supportedNips })
      }, jsonError => {
        cache.set(domain, { jsonError, supportedNips: [] })
      })
    }, fetchError => {
      cache.set(domain, { fetchError, supportedNips: [] })
    })
  }
  return cache.get(domain)
}
