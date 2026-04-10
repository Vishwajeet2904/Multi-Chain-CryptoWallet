import CryptoJS from 'crypto-js';

// Generate a key from password using PBKDF2
export function generateKeyFromPassword(password, salt) {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
}

// Encrypt data (seed phrase) with password
export function encryptData(data, password) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = generateKeyFromPassword(password, salt);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });

  return {
    salt: salt.toString(),
    iv: iv.toString(),
    encryptedData: encrypted.toString()
  };
}

// Decrypt data with password
export function decryptData(encryptedObj, password) {
  try {
    const key = generateKeyFromPassword(password, CryptoJS.enc.Hex.parse(encryptedObj.salt));
    
    const decrypted = CryptoJS.AES.decrypt(encryptedObj.encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedObj.iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('Decryption failed. Wrong password?');
  }
}

// Hash password for verification (store only hash, not password)
export function hashPassword(password) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000
  });

  return {
    salt: salt.toString(),
    hash: hash.toString()
  };
}

// Verify password against stored hash
export function verifyPassword(password, storedHash, storedSalt) {
  const hashToVerify = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(storedSalt), {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();

  return hashToVerify === storedHash;
}