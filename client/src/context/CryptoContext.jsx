/*
 * CryptoContext.jsx
 * Generates the user's ECDH key pair once on mount, registers the public
 * key with the server via Socket.io, and exposes openSecureSession(userId)
 * which derives and caches a shared AES key for any DM partner.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { generateKeyPair, exportPublicKey, importPublicKey, deriveSharedKey } from '../utils/crypto'

const CryptoContext = createContext(null)

export function CryptoProvider({ socket, children }) {
  const keyPairRef  = useRef(null)
  const sharedKeys  = useRef({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!socket) return;
    async function init() {
      const kp     = await generateKeyPair()
      keyPairRef.current = kp
      const pubB64 = await exportPublicKey(kp.publicKey)
      socket.emit('register-public-key', { publicKey: pubB64 })
      setReady(true)
    }
    init()
  }, [socket])

  useEffect(() => {
    if (!socket) return;
    socket.on('receive-public-key', async ({ fromUserId, publicKey }) => {
      if (sharedKeys.current[fromUserId]) return
      const theirKey = await importPublicKey(publicKey)
      const shared   = await deriveSharedKey(keyPairRef.current.privateKey, theirKey)
      sharedKeys.current[fromUserId] = shared
    })
    return () => socket.off('receive-public-key')
  }, [socket])

  async function openSecureSession(userId) {
    if (sharedKeys.current[userId]) return sharedKeys.current[userId]
    socket.emit('request-public-key', { targetUserId: userId })
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Key exchange timeout')), 5000)
      const interval = setInterval(() => {
        if (sharedKeys.current[userId]) {
          clearInterval(interval)
          clearTimeout(timeout)
          resolve(sharedKeys.current[userId])
        }
      }, 50)
    })
  }

  return (
    <CryptoContext.Provider value={{ ready, sharedKeys, openSecureSession }}>
      {children}
    </CryptoContext.Provider>
  )
}

export const useCrypto = () => useContext(CryptoContext)
