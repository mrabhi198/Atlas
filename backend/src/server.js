import { config } from './config/index.js';
import { initDatabase } from './db/index.js';
import { createApp } from './app.js';

const PORT = config.port;

// Initialize SQLite Database
initDatabase().catch(err => {
  console.error('Failed to initialize SQLite Database:', err);
});

const app = createApp();

// Start Server
app.listen(PORT, () => {
  console.log(`Atlas backend node listening on port ${PORT}`);
});