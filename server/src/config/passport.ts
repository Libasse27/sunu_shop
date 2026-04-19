import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import crypto from 'crypto';
import User from '../models/User.model';
import { env } from './env';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${env.SERVER_URL}/api/v1/auth/google/callback`,
    scope: ['profile', 'email'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Utilisateur';
      const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
      const avatar = profile.photos?.[0]?.value || '';

      let user = await User.findOne({ googleId: profile.id });
      if (user) return done(null, user);

      if (email) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (!user.avatar && avatar) user.avatar = avatar;
          await user.save();
          return done(null, user);
        }
      }

      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        firstName,
        lastName,
        email: email || `google_${profile.id}@noemail.com`,
        avatar,
        googleId: profile.id,
        authProvider: 'google',
        isVerified: true,
        password: randomPassword,
      });

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }));
} else {
  console.warn('[Passport] Google OAuth désactivé — GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET non configurés');
}

if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: env.FACEBOOK_APP_ID,
    clientSecret: env.FACEBOOK_APP_SECRET,
    callbackURL: `${env.SERVER_URL}/api/v1/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'picture'],
    scope: ['public_profile', 'email'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Utilisateur';
      const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
      const avatar = profile.photos?.[0]?.value || '';

      let user = await User.findOne({ facebookId: profile.id });
      if (user) return done(null, user);

      if (email) {
        user = await User.findOne({ email });
        if (user) {
          user.facebookId = profile.id;
          if (!user.avatar && avatar) user.avatar = avatar;
          await user.save();
          return done(null, user);
        }
      }

      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        firstName,
        lastName,
        email: email || `facebook_${profile.id}@noemail.com`,
        avatar,
        facebookId: profile.id,
        authProvider: 'facebook',
        isVerified: true,
        password: randomPassword,
      });

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }));
} else {
  console.warn('[Passport] Facebook OAuth désactivé — FACEBOOK_APP_ID/FACEBOOK_APP_SECRET non configurés');
}

export default passport;
