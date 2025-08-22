#!/usr/bin/env node
import { SearchConsoleServer } from './server.js';

async function main() {
  const server = new SearchConsoleServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});