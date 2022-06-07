"use strict";

const sodium = require("sodium-native");
const buf = Buffer.allocUnsafe(sodium.crypto_secretbox_KEYBYTES);
sodium.randombytes_buf(buf);
const hexString = buf.toString('hex');
process.stdout.write(hexString);
