// Dev helper: deletes the local SQLite database so it is re-created and
// re-seeded on the next server boot.
//
//   npm run db:reset -w backend
//
import fs from 'fs';
import path from 'path';
import { paths } from '../config/index.js';

if (fs.existsSync(paths.dbFile)) {
  fs.unlinkSync(paths.dbFile);
  console.log(`Removed database: ${path.relative(process.cwd(), paths.dbFile)}`);
} else {
  console.log('No database file found — nothing to reset.');
}
console.log('Next server boot will re-create the schema and seed demo data.');