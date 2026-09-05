import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import { config } from './config/index.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import adminRoutes from './routes/admin.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import learningRoutes from './routes/learning.routes.js';
import missionsRoutes from './routes/missions.routes.js';
import mentorRoutes from './routes/mentor.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Session is required for Passport OAuth strategies (to manage state)
  app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'atlas-backend', time: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/tags', adminRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/missions', missionsRoutes);
  app.use('/api/mentor', mentorRoutes);
  app.use('/api', learningRoutes); // tracks, lessons, bookmarks, revision, quiz

  return app;
}