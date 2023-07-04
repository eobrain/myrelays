const shuffle = xs => xs
  .map(x => ({ x, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ x }) => x)

export const nostrWatchRelays = async () =>
  shuffle(
    (await (
      (await fetch('https://api.nostr.watch/v1/public')
      ).json())
    ).slice(0, 10))

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

  let startMs
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
        limit: 50
      }]))
    }
  })

  // Listen for messages
  socket.addEventListener('message', (messageJson) => {
    const [first, ...rest] = JSON.parse(messageJson.data)
    switch (first) {
      case 'EVENT': {
        const [receivedSubscription, event] = rest
        if (!startMs && receivedSubscription === subscription + 1) {
          startMs = Date.now()
        }
        checkSubsription(receivedSubscription)
        callback(event)
        break
      }
      case 'EOSE': {
        const [receivedSubscription] = rest
        if (receivedSubscription !== subscription + 1) {
          break
        }
        const elapsedMs = startMs ? Date.now() - startMs : undefined
        checkSubsription(receivedSubscription)
        // setTimeout(() => {
        //  socket.send(JSON.stringify(['CLOSE', subscription]))
        //  socket.close()
        // }, 10000)
        eose(elapsedMs)
        break
      }
      case 'NOTICE': {
        const [notice] = rest
        console.log(`Ignoring message NOTICE ${notice} from ${relay}`)
        break
      }
      case 'AUTH': {
        const [something] = rest
        console.log(`Ignoring message AUTH ${something} from ${relay}`)
        break
      }
      case 'OK': {
        const [, , something] = rest
        console.log(`Ignoring message OK ${something} from ${relay}`)
        break
      }
      default:
        throw new Error(`Unexpected message format "${messageJson}"`)
    }
  })
}
