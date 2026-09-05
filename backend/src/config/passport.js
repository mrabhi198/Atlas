import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { config } from './index.js';

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl
  },
  async (accessToken, refreshToken, profile, done) => {
    // Pass the profile along to the route handler
    return done(null, profile);
  }
));

// Configure GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: config.github.clientId,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackUrl
  },
  async (accessToken, refreshToken, profile, done) => {
    // Pass the profile along to the route handler
    return done(null, profile);
  }
));

export default passport;