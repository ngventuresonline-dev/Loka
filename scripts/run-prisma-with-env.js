/**
 * Run Prisma CLI with .env.local loaded (for DATABASE_URL etc).
 * Usage: node scripts/run-prisma-with-env.js db push
 *        node scripts/run-prisma-with-env.js migrate dev
 */
const { config } = require('dotenv')
const { resolve } = require('path')
const { execSync } = require('child_process')

config({ path: resolve(__dirname, '../.env.local') })
execSync(`npx prisma ${process.argv.slice(2).join(' ')}`, { stdio: 'inherit', env: process.env })
