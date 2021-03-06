import aes256 from 'aes256'
import srp from 'secure-remote-password/client'
import pbkdf2Lib from 'pbkdf2'
import randomBytes from 'randombytes'

import net from '@/modules/net'

class Auth {
  constructor () {
    this.clientEphemeral = null
    this.clientSession = null
  }

  reencrypt = async (olduser, newuser, input, encryptor = this.encrypt, decryptor = this.decrypt) => {
    try {
    // get encryption keys
      const oldKey = this.getEncryptionKey(olduser)
      const newKey = this.getEncryptionKey(newuser)

      // re-encrypt with new key
      const decrypted = await decryptor(input, oldKey, this.decryptObj)
      const encrypted = await encryptor(decrypted, newKey, this.encryptObj)
      return encrypted
    } catch (err) {
      console.error(err)
      throw new Error('auth.reencrypt')
    }
  }

  createEncryptionKey = async (userid = net.getUserID()) => {
    try {
      const buf = await getRandomBytes(64)
      const key = buf.toString('base64')
      this.setEncryptionKey(key, userid)
    } catch (error) {
      console.error(error)
      throw 'error.auth.datakey.create'
    }
  }

  getEncryptionKey = (userid = net.getUserID()) => {
    return localStorage.getItem(`key_${userid}`)
  }

  setEncryptionKey = (key, userid = net.getUserID()) => {
    return localStorage.setItem(`key_${userid}`, key)
  }

  getEncryptionKeyWithPass = async pass => {
    try {
      const decrypted = await this.getEncryptionKey()
      const encrypted = await aes256.encrypt(pass, decrypted)
      return encrypted
    } catch (error) {
      console.error(error)
      throw 'error.auth.datakey'
    }
  }

  setEncryptionKeyWithPass = async (pass, encrypted) => {
    try {
      const key = await aes256.decrypt(pass, encrypted)
      this.setEncryptionKey(key)
    } catch (error) {
      console.error(error)
      throw 'error.auth.datakey'
    }
  }

  createVerifier = async (username, password) => {
    try {
      const salt = srp.generateSalt()
      const privateKey = await this.getPrivateKey(username, password, salt)
      const verifier = srp.deriveVerifier(privateKey)
      return { verifier, salt }
    } catch (error) {
      console.error(error)
      throw 'error.auth.createVerifier'
    }
  }

  getPrivateKey = async (username, password, salt) => {
    try {
      const secret = `${username}:${password}`
      const keyBuf = await pbkdf2(secret, salt, 20000, 64, 'sha512')
      const privateKey = keyBuf.toString('hex')
      return privateKey
    } catch (error) {
      console.error(error)
      throw 'error.auth.privateKey'
    }
  }

  createEphemeral = async () => {
    this.clientEphemeral = srp.generateEphemeral()
    return this.clientEphemeral.public
  }

  createSession = async (username, password, salt, serverEphemeralPublic) => {
    const privateKey = await this.getPrivateKey(username, password, salt)
    this.clientSession = await srp.deriveSession(this.clientEphemeral.secret, serverEphemeralPublic, salt, username, privateKey)
    return this.clientSession.proof
  }

  // Base encrypt
  encrypt = async (data, key) => {
    try {
      if (!key) key = this.getEncryptionKey()
      data = JSON.stringify(data)
      const encrypted = await aes256.encrypt(key, data)
      return encrypted
    } catch (error) {
      console.warn(error)
      throw 'error.auth.encrypterror'
    }
  }

  // Base decrypt
  decrypt = async (data, key) => {
    try {
      if (!key) key = this.getEncryptionKey()
      console.log(key)
      const decrypted = await aes256.decrypt(key, data)
      console.log(decrypted)
      return JSON.parse(decrypted)
    } catch (error) {
      console.warn(error)
      throw 'error.auth.decrypterror'
    }
  }

  // Decrypt array with specified decryptor function
  decryptArray = async (dataArray, key, decryptor = this.decrypt) => {
    var decryptedArray = []
    if (dataArray) {
      for await (const element of dataArray) {
        const decrypted = await decryptor(element, key)
        decryptedArray.push(decrypted)
      }
    }
    return decryptedArray
  }

  // Encrypt array with specified encryptor function
  encryptArray = async (dataArray, key, encryptor = this.decrypt) => {
    var encryptedArray = []
    if (dataArray) {
      for await (const element of dataArray) {
        const decrypted = await encryptor(element, key)
        encryptedArray.push(decrypted)
      }
    }
    return encryptedArray
  }

  decryptObj = async (obj, key) => {
    var newObj = {}
    if (!obj) {
      throw 'error.auth.decrypterror'
    }
    for (const [prop, value] of Object.entries(obj)) {
      if (!['taskid', 'listid', 'userid', 'deleted', 'modified'].includes(prop)) {
        if (value) {
          newObj[prop] = await this.decrypt(value, key)
        } else {
          newObj[prop] = null
        }
      } else {
        newObj[prop] = value
      }
    }
    return newObj
  }

  encryptObj = async (obj, key) => {
    var newObj = {}
    if (!obj) {
      throw 'error.auth.encrypterror'
    }
    for (const [prop, value] of Object.entries(obj)) {
      if (!['taskid', 'listid', 'userid', 'deleted', 'modified'].includes(prop)) {
        if (value) {
          newObj[prop] = await this.encrypt(value, key)
        } else {
          newObj[prop] = null
        }
      } else {
        newObj[prop] = value
      }
    }
    return newObj
  }
}

function getRandomBytes (bytes = 128) { // returns promise
  return new Promise((resolve, reject) => {
    randomBytes(bytes, function (err, buffer) {
      if (err) {
        reject(err)
      }
      resolve(buffer)
    })
  })
}

function pbkdf2 (secret, salt, iterations, keylen, algorithm) { // returns promise
  return new Promise((resolve, reject) => {
    pbkdf2Lib.pbkdf2(secret, salt, iterations, keylen, algorithm, function (err, derKey) {
      if (err) {
        console.error(err)
        reject(err)
      }
      resolve(derKey)
    })
  })
}

export default new Auth()
