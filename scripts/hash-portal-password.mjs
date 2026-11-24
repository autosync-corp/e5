#!/usr/bin/env node
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-portal-password.mjs 'the-password'");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;

console.log(hash);
console.log('\nSet Vercel env PORTAL_PASSWORD_HASH to the line above.');
console.log('Also set PORTAL_SESSION_SECRET to a long random string (openssl rand -base64 32).');
