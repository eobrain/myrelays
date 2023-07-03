export const SEED_RELAYS = [
  'nostr.1f52b.xyz',
  'nostr.bitocial.xyz',
  'nostr.lu.ke',
  'nostr.naut.social',
  'nostr.sandwich.farm',
  'nostr.sidnlabs.nl',
  'nostramsterdam.vpx.moe',
  'relay.mostr.pub',
  'relay.n057r.club',
  'relay.nostr.hach.re',
  'relay.snort.social'
].map(host => `wss://${host}`)

/* global WebSocket crypto */

const sockets = []

export function closeSockets () {
  for (const socket of sockets) {
    socket.close()
  }
}

export function getEvents (relay, kinds, callback, eose) {
  const socket = new WebSocket(relay)
  sockets.push(socket)
  socket.onerror = eose

  const subscription = `myrelays-${crypto.randomUUID()}`
  const subscriptionPattern = new RegExp(subscription + '[12]')
  function checkSubsription (receivedSubscription) {
    if (!receivedSubscription.match(subscriptionPattern)) {
      throw new Error(`Unexpected subscription "${receivedSubscription}"`)
    }
  }

  // Connection opened
  socket.addEventListener('open', (event) => {
    for (const kind of kinds) {
      socket.send(JSON.stringify(['REQ', subscription + kind, {
        // "ids": <a list of event ids or prefixes>,
        // "authors": <a list of pubkeys or prefixes, the pubkey of an event must be one of these>,
        kinds: [kind],
        // "#e": <a list of event ids that are referenced in an "e" tag>,
        // "#p": <a list of pubkeys that are referenced in a "p" tag>,
        // "since": <an integer unix timestamp, events must be newer than this to pass>,
        // "until": <an integer unix timestamp, events must be older than this to pass>,
        limit: 200
      }]))
    }
  })

  // Listen for messages
  socket.addEventListener('message', (messageJson) => {
    const [first, ...rest] = JSON.parse(messageJson.data)
    switch (first) {
      case 'EVENT': {
        const [receivedSubscription, event] = rest
        checkSubsription(receivedSubscription)
        callback(event)
        break
      }
      case 'EOSE': {
        const [receivedSubscription] = rest
        checkSubsription(receivedSubscription)
        socket.send(JSON.stringify(['CLOSE', subscription]))
        socket.close()
        eose()
        break
      }
      case 'NOTICE': {
        const [notice] = rest
        alert(notice)
        break
      }
      case 'AUTH': {
        const [something] = rest
        console.log(`Ignoring message AUTH ${something} from ${relay}`)
        break
      }
      default:
        throw new Error(`Unexpected message format "${messageJson}"`)
    }
  })
}
