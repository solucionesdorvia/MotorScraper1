import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { Express } from 'express';
import { storage } from './storage';

export async function setupSocialAuth(app: Express) {
  // Configurar serialización y deserialización de usuario
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Configurar estrategia de Twitter
  if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "/api/auth/twitter/callback",
      includeEmail: true
    }, async (token, tokenSecret, profile, done) => {
      try {
        // Buscar o crear el usuario
        let user = await storage.getUserBySocialId('twitter', profile.id);
        
        if (!user) {
          // Si el usuario no existe, crearlo
          user = await storage.createSocialUser({
            email: profile.emails?.[0]?.value || `${profile.username}@twitter.user`,
            nombre: profile.displayName || profile.username || null,
            apellido: null,
            password: '', // No se necesita contraseña para autenticación social
            socialProvider: 'twitter',
            socialId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value || null
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));

    // Rutas para Twitter
    app.get('/api/auth/twitter', passport.authenticate('twitter'));
    app.get('/api/auth/twitter/callback', 
      passport.authenticate('twitter', { 
        failureRedirect: '/login',
        successRedirect: '/'
      })
    );
  }

  // Configurar estrategia de Google
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar o crear el usuario
        let user = await storage.getUserBySocialId('google', profile.id);
        
        if (!user) {
          // Si el usuario no existe, crearlo
          user = await storage.createSocialUser({
            email: profile.emails?.[0]?.value || `${profile.id}@google.user`,
            nombre: profile.name?.givenName || null,
            apellido: profile.name?.familyName || null,
            password: '', // No se necesita contraseña para autenticación social
            socialProvider: 'google',
            socialId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value || null
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));

    // Rutas para Google
    app.get('/api/auth/google', 
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    app.get('/api/auth/google/callback', 
      passport.authenticate('google', { 
        failureRedirect: '/login',
        successRedirect: '/'
      })
    );
  }

  // Configurar estrategia de Apple
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
      callbackURL: "/api/auth/apple/callback",
      scope: ['name', 'email']
    }, async (accessToken, refreshToken, idToken, profile, done) => {
      try {
        // El perfil de Apple puede no tener toda la información la primera vez
        const appleId = idToken.sub;
        const email = idToken.email;

        // Buscar o crear el usuario
        let user = await storage.getUserBySocialId('apple', appleId);
        
        if (!user) {
          // Si el usuario no existe, crearlo
          user = await storage.createSocialUser({
            email: email || `${appleId}@apple.user`,
            nombre: profile.name?.firstName || null,
            apellido: profile.name?.lastName || null,
            password: '', // No se necesita contraseña para autenticación social
            socialProvider: 'apple',
            socialId: appleId,
            profileImageUrl: null // Apple no proporciona foto de perfil
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));

    // Rutas para Apple
    app.get('/api/auth/apple', passport.authenticate('apple'));
    app.get('/api/auth/apple/callback', 
      passport.authenticate('apple', { 
        failureRedirect: '/login',
        successRedirect: '/'
      })
    );
  }

  // Middleware de passport
  app.use(passport.initialize());
  app.use(passport.session());
}