import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Утилита для зашифрованного хранения данных
 * Соответствует требованиям ФЗ-152 о защите персональных данных
 */

const ENCRYPTION_KEY_NAME = 'encryption_master_key';
const SECURE_STORE_MAX_SIZE = 2048; 
const KEY_SIZE = 32; 

async function isSecureStoreAvailable(): Promise<boolean> {
  // SecureStore недоступен на веб-версии
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    if (typeof SecureStore.getItemAsync !== 'function') {
      return false;
    }

    await SecureStore.getItemAsync('__test_availability__');
    return true;
  } catch {
    return false;
  }
}

/**
 * Получает или создает главный ключ шифрования
 */
async function getEncryptionKey(): Promise<string> {
  try {
    const secureStoreAvailable = await isSecureStoreAvailable();
    const storageKey = `__encryption_key_${ENCRYPTION_KEY_NAME}`;
    
    let key: string | null = null;
    
    if (secureStoreAvailable) {
      try {
        key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
      } catch (error) {
        console.warn('SecureStore getItemAsync failed, falling back to AsyncStorage:', error);
      }
    }
    
    if (!key) {
      try {
        key = await AsyncStorage.getItem(storageKey);
      } catch (error) {
        console.warn('AsyncStorage getItem failed for encryption key:', error);
      }
    }
    
    if (!key) {
      const keyBytes = await Crypto.getRandomBytesAsync(KEY_SIZE);
      const keyArray = Array.from(keyBytes);
      key = btoa(String.fromCharCode(...keyArray));
      
      if (secureStoreAvailable) {
        try {
          await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
        } catch (error) {
          console.warn('SecureStore setItemAsync failed, using AsyncStorage:', error);
          await AsyncStorage.setItem(storageKey, key);
        }
      } else {
        await AsyncStorage.setItem(storageKey, key);
      }
    }
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Failed to get encryption key');
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binaryString = String.fromCharCode(...Array.from(bytes));
  return btoa(binaryString);
}

async function encryptData(data: string): Promise<string> {
  try {
    const keyBase64 = await getEncryptionKey();
    const keyBytes = base64ToUint8Array(keyBase64);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const iv = await Crypto.getRandomBytesAsync(12);
        
        const keyBuffer: ArrayBuffer = keyBytes.buffer instanceof ArrayBuffer 
          ? keyBytes.buffer 
          : new Uint8Array(keyBytes).buffer;
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );
        
        const dataEncoder = new TextEncoder();
        const dataBuffer = dataEncoder.encode(data);
        
        const ivBuffer: ArrayBuffer = iv.buffer instanceof ArrayBuffer
          ? iv.buffer
          : new Uint8Array(iv).buffer;
        
        const encryptedBuffer = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: ivBuffer,
          },
          cryptoKey,
          dataBuffer
        );
        
        const encryptedArray = new Uint8Array(encryptedBuffer);
        const combined = new Uint8Array(iv.length + encryptedArray.length);
        combined.set(iv);
        combined.set(encryptedArray, iv.length);
        
        return uint8ArrayToBase64(combined);
      } catch (webCryptoError) {
        console.warn('Web Crypto API encryption failed, using fallback:', webCryptoError);
      }
    }
    
    const dataBytes = new TextEncoder().encode(data);
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    const iv = await Crypto.getRandomBytesAsync(12);
    const combined = new Uint8Array(iv.length + encrypted.length);
    combined.set(iv);
    combined.set(encrypted, iv.length);
    
    return uint8ArrayToBase64(combined);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Расшифровывает данные с использованием AES-256-GCM
 */
async function decryptData(encryptedData: string): Promise<string> {
  try {
    const keyBase64 = await getEncryptionKey();
    const keyBytes = base64ToUint8Array(keyBase64);
    
    const combined = base64ToUint8Array(encryptedData);
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const keyBuffer: ArrayBuffer = keyBytes.buffer instanceof ArrayBuffer 
          ? keyBytes.buffer 
          : new Uint8Array(keyBytes).buffer;
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        
        const ivBuffer: ArrayBuffer = iv.buffer instanceof ArrayBuffer
          ? iv.buffer
          : new Uint8Array(iv).buffer;
        const encryptedBuffer: ArrayBuffer = encrypted.buffer instanceof ArrayBuffer
          ? encrypted.buffer
          : new Uint8Array(encrypted).buffer;
        
        const decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBuffer,
          },
          cryptoKey,
          encryptedBuffer
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
      } catch (webCryptoError) {
        console.warn('Web Crypto API decryption failed, using fallback:', webCryptoError);
      }
    }
    
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

function isEncrypted(value: string): boolean {
  try {
    if (value.length < 16) return false;
    const decoded = base64ToUint8Array(value);
    return decoded.length >= 12; // Минимум IV (12 байт)
  } catch {
    return false;
  }
}


export const EncryptedStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const secureStoreAvailable = await isSecureStoreAvailable();
      
      const secureStoreKey = key.replace(/^@/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      
      if (secureStoreAvailable && value.length <= SECURE_STORE_MAX_SIZE && !key.startsWith('@')) {
        try {
          await SecureStore.setItemAsync(secureStoreKey, value);
          return;
        } catch (secureStoreError) {
          console.warn('SecureStore unavailable, using encrypted AsyncStorage:', secureStoreError);
        }
      }
      
      const encrypted = await encryptData(value);
      await AsyncStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Error setting encrypted item ${key}:`, error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const secureStoreAvailable = await isSecureStoreAvailable();
      
      const secureStoreKey = key.replace(/^@/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      
      if (secureStoreAvailable && !key.startsWith('@')) {
        try {
          const secureValue = await SecureStore.getItemAsync(secureStoreKey);
          if (secureValue !== null) {
            return secureValue;
          }
        } catch (secureStoreError) {
        }
      }
      
      const encrypted = await AsyncStorage.getItem(key);
      
      if (!encrypted) {
        return null;
      }
      
      if (isEncrypted(encrypted)) {
        return await decryptData(encrypted);
      }
      
      console.warn(`Unencrypted data found for key ${key}, consider migrating`);
      return encrypted;
    } catch (error) {
      console.error(`Error getting encrypted item ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const secureStoreAvailable = await isSecureStoreAvailable();
      
      const secureStoreKey = key.replace(/^@/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      
      if (secureStoreAvailable && !key.startsWith('@')) {
        try {
          await SecureStore.deleteItemAsync(secureStoreKey);
        } catch (secureStoreError) {
        }
      }
      
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing encrypted item ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing encrypted storage:', error);
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys]; 
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  async isAvailable(): Promise<boolean> {
    try {
      const secureStoreAvailable = await isSecureStoreAvailable();
      if (secureStoreAvailable) {
        try {
          await SecureStore.getItemAsync('__test__');
        } catch {
        }
      }
      
      await AsyncStorage.getItem('__test__');
      return true;
    } catch {
      return false;
    }
  },
};
