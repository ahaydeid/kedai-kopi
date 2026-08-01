#!/usr/bin/env node
/**
 * Script bantu: generate SHA-256 hash dari password admin
 * Jalankan: node scripts/hash-admin-password.mjs
 * Salin output ke migration SQL sebagai nilai kolom 'password'
 */

import { createHash } from 'crypto'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stdout })

rl.question('Masukkan password admin: ', (password) => {
  const hash = createHash('sha256').update(password).digest('hex')
  console.log('\n✅ SHA-256 Hash:')
  console.log(hash)
  console.log('\nSalin hash di atas ke migration SQL (kolom password pada INSERT admin).\n')
  rl.close()
})
