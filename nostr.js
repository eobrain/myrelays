export const SEED_RELAYS = [
  'relay.n057r.club',
  'nostramsterdam.vpx.moe',
  'relay.mostr.pub',
  'nostr.sandwich.farm',
  'nostr.lu.ke',
  'nostr.1f52b.xyz'
  // 'nostr.bitocial.xyz'
].map(host => `wss://${host}`)

export function getNotes (relay, callback, eose) {
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
