/*
 * Copyright (c) 2017-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const forge = require('node-forge');

const api = {};
module.exports = api;

api.createJws = createJwsFactory();

/**
 * Converts the given date into W3C datetime format (eg: 2011-03-09T21:55:41Z).
 *
 * @param date the date to convert.
 *
 * @return the date in W3C datetime format.
 */
api.w3cDate = date => {
  if(date === undefined || date === null) {
    date = new Date();
  } else if(typeof date === 'number' || typeof date === 'string') {
    date = new Date(date);
  }
  const str = date.toISOString();
  return str.substr(0, str.length - 5) + 'Z';
};

/**
 * Encodes input according to the "Base64url Encoding" format as specified
 * in JSON Web Signature (JWS) RFC7517. A URL safe character set is used and
 * trailing '=', line breaks, whitespace, and other characters are omitted.
 *
 * @param data {Uint8Array} the data to encode.
 *
 * @return {String} the encoded value.
 */
api.encodeBase64Url = base64urlEncodeFactory();

/**
 * Decodes input according to the "Base64url Encoding" format as specified
 * in JSON Web Signature (JWS) RFC7517. A URL safe character set is used and
 * trailing '=', line breaks, whitespace, and other characters are omitted.
 *
 * @param string {String} the string to decode.
 *
 * @return {Uint8Array} the decoded value.
 */
api.decodeBase64Url = base64urlDecodeFactory();

/**
 * Decodes input according to the "Base64url Encoding" format as specified
 * in JSON Web Signature (JWS) RFC7517. A URL safe character set is used and
 * trailing '=', line breaks, whitespace, and other characters are omitted.
 *
 * @param string {String} the string to decode.
 *
 * @return {String} the decoded value as a string.
 */
api.decodeBase64UrlToString = base64urlDecodeToStringFactory();

/**
 * Hashes a string of data using SHA-256.
 *
 * @param string {String} the string to hash.
 * @param encoding {String} the string's encoding (e.g. 'utf8').
 *
 * @return {Uint8Array} the hash digest.
 */
api.sha256 = sha256Factory();

/**
 * Concatenates two Uint8Arrays.
 *
 * @param b1 {Uint8Array}.
 * @param b2 {Uint8Array}.
 *
 * @return {Uint8Array} the result.
 */
api.concat = concatFactory();

/**
 * Converts a string to a Uint8Array.
 *
 * @param string {String}.
 * @param encoding {String}, e.g. 'utf8'.
 *
 * @return {Uint8Array} the result.
 */
api.stringToBytes = stringToBytesFactory();

function stringToBytesFactory() {
  return (string, encoding) => {
    const buffer = new forge.util.ByteBuffer(string, encoding);
    return forge.util.binary.raw.decode(buffer.getBytes());
  };
}

function concatFactory() {
  return (b1, b2) => {
    const rval = new Uint8Array(b1.length + b2.length);
    rval.set(b1, 0);
    rval.set(b2, b1.length);
    return rval;
  };
}

function sha256Factory() {
  return (string, encoding) => {
    const md = forge.md.sha256.create();
    md.update(string, encoding || 'utf8');
    const buffer = md.digest();
    return forge.util.binary.raw.decode(buffer.getBytes());
  };
}

function createJwsFactory() {
  return ({encodedHeader, verifyData}) => {
    const buffer = new forge.util.ByteBuffer(encodedHeader + '.', 'utf8');
    const binaryString = forge.util.binary.raw.encode(verifyData);
    buffer.putBytes(binaryString);
    return forge.util.binary.raw.decode(buffer.getBytes());
  };
}

function base64urlEncodeFactory() {
  return data => {
    let binaryString;
    if(typeof data === 'string') {
      binaryString = forge.util.encodeUtf8(data);
    } else {
      binaryString = forge.util.binary.raw.encode(data);
    }
    const enc = forge.util.encode64(binaryString);
    return enc.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
}

function base64urlDecodeFactory() {
  return string => {
    // FIXME: forge supports alternative alphabets now -- use that instead?
    // convert to regular base64 encoding and then decode
    let base64 = string.replace(/-/g, '+').replace(/_/g, '/');
    const mod4 = base64.length % 4;
    if(mod4 === 0) {
      // pass
    } else if(mod4 === 2) {
      base64 = base64 + '==';
    } else if(mod4 === 3) {
      base64 = base64 + '=';
    } else {
      throw new Error('Illegal base64 string.');
    }
    return forge.util.binary.base64.decode(base64);
  };
}

function base64urlDecodeToStringFactory() {
  return string => {
    // FIXME: forge supports alternative alphabets now -- use that instead?
    // convert to regular base64 encoding and then decode
    let base64 = string.replace(/-/g, '+').replace(/_/g, '/');
    const mod4 = base64.length % 4;
    if(mod4 === 0) {
      // pass
    } else if(mod4 === 2) {
      base64 = base64 + '==';
    } else if(mod4 === 3) {
      base64 = base64 + '=';
    } else {
      throw new Error('Illegal base64 string.');
    }
    const binaryString = forge.util.decode64(base64);
    return forge.util.decodeUtf8(binaryString);
  };
}
