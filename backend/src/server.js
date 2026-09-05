import { config } from './config/index.js';
import { initDatabase } from './db/index.js';
import { createApp } from './app.js';

const PORT = config.port;

// Surface unhandled async rejections instead of silently dropping them.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Initialize SQLite Database, then start the server. Starting only after the DB
// is ready prevents a window where requests race an unfinished schema setup.
initDatabase()
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Atlas backend node listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize SQLite Database:', err);
    process.exit(1);
  });