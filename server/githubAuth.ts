import passport from "passport";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage.js";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

passport.serializeUser((user: any, cb) => cb(null, user));
passport.deserializeUser((user: any, cb) => cb(null, user));

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? "https://your-domain.vercel.app/api/auth/callback/github"
        : "http://localhost:5000/api/auth/callback/github",
      scope: ["user:email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: (err: any, user?: any) => void
    ) => {
      try {
        // Upsert user in DB
        const userData = {
          email: profile.emails?.[0]?.value || null,
          firstName: profile.displayName || profile.username || null,
          lastName: null,
          profileImageUrl: profile.photos?.[0]?.value || null,
        };
        
        await storage.upsertUser(userData);
        
        const user = {
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          username: profile.username,
          profileImageUrl: profile.photos?.[0]?.value,
          accessToken,
        };
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/auth/login/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/api/auth/callback/github",
    passport.authenticate("github", {
      failureRedirect: "/api/auth/login/github",
      successReturnToOrRedirect: "/",
    })
  );

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};