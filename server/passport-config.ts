import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { Request } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Funciones auxiliares para encontrar o crear usuarios sociales
async function findOrCreateSocialUser({ 
  provider, 
  id, 
  email, 
  firstName, 
  lastName, 
  profileImage 
}: { 
  provider: string; 
  id: string; 
  email: string; 
  firstName?: string | null; 
  lastName?: string | null; 
  profileImage?: string | null; 
}) {
  // Buscar usuario por ID social
  const [existingUser] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.socialProvider, provider),
        eq(users.socialId, id)
      )
    );
    
  if (existingUser) {
    return existingUser;
  }
  
  // Buscar usuario por email para vincular cuentas
  const [emailUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
    
  if (emailUser) {
    // Actualizar usuario existente con información social
    const [updatedUser] = await db
      .update(users)
      .set({
        socialProvider: provider,
        socialId: id,
        profileImageUrl: profileImage || emailUser.profileImageUrl
      })
      .where(eq(users.id, emailUser.id))
      .returning();
      
    return updatedUser;
  }
  
  // Crear nuevo usuario social
  const [newUser] = await db
    .insert(users)
    .values({
      email: email,
      password: '', // Los usuarios sociales no necesitan contraseña
      nombre: firstName || null,
      apellido: lastName || null,
      profileImageUrl: profileImage || null,
      socialProvider: provider,
      socialId: id
    })
    .returning();
    
  return newUser;
}

export function configurePassport() {
  // Serializar/deserializar usuario
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
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
        const user = await findOrCreateSocialUser({
          provider: 'twitter',
          id: profile.id,
          email: profile.emails?.[0]?.value || `${profile.username}@twitter.user`,
          firstName: profile.displayName?.split(' ')[0] || null,
          lastName: profile.displayName?.split(' ').slice(1).join(' ') || null,
          profileImage: profile.photos?.[0]?.value || null
        });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Configurar estrategia de Google
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateSocialUser({
          provider: 'google',
          id: profile.id,
          email: profile.emails?.[0]?.value || `${profile.id}@google.user`,
          firstName: profile.name?.givenName || null,
          lastName: profile.name?.familyName || null,
          profileImage: profile.photos?.[0]?.value || null
        });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Configurar estrategia de Apple
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
      callbackURL: "/api/auth/apple/callback"
    }, async (accessToken, refreshToken, idToken: any, profile, done) => {
      try {
        // Apple proporciona menos información de perfil
        const user = await findOrCreateSocialUser({
          provider: 'apple',
          id: idToken.sub,
          email: idToken.email || `${idToken.sub}@apple.user`,
          firstName: profile?.name?.firstName || null,
          lastName: profile?.name?.lastName || null,
          profileImage: null // Apple no proporciona imágenes de perfil
        });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  return passport;
}