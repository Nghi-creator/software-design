import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import * as userModel from "../models/user.model.js";

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Hàm dùng chung cho TẤT CẢ các mạng xã hội (Chuẩn DRY)
async function handleOAuthLogin(provider, profile, email) {
  // 1. Kiểm tra OAuth Provider
  let user = await userModel.findByOAuthProvider(provider, profile.id);
  if (user) return user;

  // 2. Kiểm tra Email để liên kết tài khoản
  if (email) {
    user = await userModel.findByEmail(email);
    if (user) {
      await userModel.addOAuthProvider(user.id, provider, profile.id);
      return user;
    }
  }

  // 3. Tạo tài khoản mới
  return await userModel.add({
    email: email || `${provider}_${profile.id}@oauth.local`,
    fullname: profile.displayName || profile.username || `${provider} User`,
    password_hash: null,
    address: "",
    role: "bidder",
    email_verified: true,
    oauth_provider: provider,
    oauth_id: profile.id,
  });
}

// Cấu hình Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await handleOAuthLogin("google", profile, email);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

// Cấu hình Facebook
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "name", "emails"],
      enableProof: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await handleOAuthLogin("facebook", profile, email);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

// Cấu hình GitHub
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await handleOAuthLogin("github", profile, email);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

export default passport;
