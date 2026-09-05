import { getDb } from './index.js';

// Serialized transactions for the single sqlite connection.
//
// sqlite3 (without a WAL connection pool) cannot run two transactions at once;
// without serialization, a second BEGIN while another transaction is open throws
// "cannot start a transaction within a transaction". This mutex queues
// transactional work so each BEGIN…COMMIT pair runs to completion.

let tail = Promise.resolve();

export function withTransaction(fn) {
  const run = async () => {
    const db = getDb();
    await db.run('BEGIN');
    try {
      const result = await fn(db);
      await db.run('COMMIT');
      return result;
    } catch (err) {
      await db.run('ROLLBACK');
      throw err;
    }
  };
  const result = tail.then(run, run);
  tail = result.then(() => {}, () => {});
  return result;
}