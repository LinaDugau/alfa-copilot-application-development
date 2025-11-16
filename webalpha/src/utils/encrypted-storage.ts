const ENCRYPTION_KEY_NAME = 'encryption_master_key'

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyName = `${ENCRYPTION_KEY_NAME}_${btoa(ENCRYPTION_KEY_NAME)}`
  let keyB64 = localStorage.getItem(keyName)
  
  if (!keyB64) {
    console.log('[EncryptedStorage] Generating new encryption key...')
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const exported = await crypto.subtle.exportKey('raw', key)
    const keyArray = new Uint8Array(exported)
    keyB64 = btoa(String.fromCharCode(...Array.from(keyArray)))
    localStorage.setItem(keyName, keyB64)
    console.log('[EncryptedStorage] Encryption key saved to localStorage')
  } else {
    console.log('[EncryptedStorage] Using existing encryption key')
  }

  try {
    const keyBuffer = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0)).buffer
    return crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  } catch (error) {
    console.error('[EncryptedStorage] Error importing encryption key:', error)
    console.log('[EncryptedStorage] Generating new key due to import error...')
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const exported = await crypto.subtle.exportKey('raw', key)
    const keyArray = new Uint8Array(exported)
    keyB64 = btoa(String.fromCharCode(...Array.from(keyArray)))
    localStorage.setItem(keyName, keyB64)
    const keyBuffer = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0)).buffer
    return crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  }
}

async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(data)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.byteLength)
  return btoa(String.fromCharCode(...Array.from(combined)))
}

async function decryptData(encryptedB64: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

function isEncrypted(value: string): boolean {
  try {
    const decoded = Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
    return decoded.length >= 12 
  } catch {
    return false
  }
}

export const EncryptedStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const cryptoKey = await getEncryptionKey()
      const encrypted = await encryptData(value, cryptoKey)
      localStorage.setItem(key, encrypted)
      console.log(`[EncryptedStorage] Successfully saved ${key}`)
    } catch (error) {
      console.error(`[EncryptedStorage] Error saving ${key}:`, error)
      throw error
    }
  },

  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) {
      console.log(`[EncryptedStorage] No data found for key: ${key}`)
      return null
    }
    
    if (isEncrypted(encrypted)) {
      try {
        const cryptoKey = await getEncryptionKey()
        const decrypted = await decryptData(encrypted, cryptoKey)
        console.log(`[EncryptedStorage] Successfully decrypted ${key}`)
        return decrypted
      } catch (error) {
        console.error(`[EncryptedStorage] Error decrypting ${key}:`, error)
        try {
          const parsed = JSON.parse(encrypted)
          console.log(`[EncryptedStorage] Fallback: returning parsed JSON for ${key}`)
          return parsed
        } catch {
          console.log(`[EncryptedStorage] Fallback: returning raw string for ${key}`)
          return encrypted
        }
      }
    }
    
    console.log(`[EncryptedStorage] Returning legacy (unencrypted) data for ${key}`)
    return encrypted
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key)
  },

  async clear(): Promise<void> {
    localStorage.clear()
  },

  async getAllKeys(): Promise<string[]> {
    return Object.keys(localStorage)
  },
}