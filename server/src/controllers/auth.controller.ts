import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken';
import { sendEmail, emailTemplates } from '../utils/sendEmail';
import { env } from '../config/env';
import { redis } from '../config/redis';

// ─── OTP store pour l'échange OAuth (Redis) ───────────────────────────────────
// Évite de passer le JWT en clair dans l'URL (logs, historique, Referer).
// Chaque code est usage unique et expire dans 30 secondes.
// Stocké dans Redis pour résister aux redémarrages et déploiements multi-instances.
const OTP_TTL_SECONDS = 30;
const OTP_PREFIX = 'otp:social:';

// Mobile clients (Flutter) send X-Client: mobile — they can't use HttpOnly cookies
const isMobile = (req: Request) => req.headers['x-client'] === 'mobile';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Un compte avec cet email existe déjà');
  }

  const user = await User.create({ firstName, lastName, email, phone, password });

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  // Stocker uniquement le hash du refreshToken (bcrypt, 8 rounds — vitesse > sécurité ici)
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  try {
    const template = emailTemplates.welcome(firstName);
    await sendEmail({ to: email, ...template });
  } catch {
    // Email failure shouldn't block registration
  }

  ApiResponse.created(res, {
    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, isVerified: user.isVerified },
    accessToken,
    ...(isMobile(req) && { refreshToken }),
  }, 'Inscription réussie');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw ApiError.unauthorized('Compte temporairement verrouillé, réessayez plus tard');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Compte désactivé');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      user.loginAttempts = 0;
    }
    await user.save();
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  // Stocker uniquement le hash du refreshToken
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.success(res, {
    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, isVerified: user.isVerified },
    accessToken,
    ...(isMobile(req) && { refreshToken }),
  }, 'Connexion réussie');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    // Invalider le hash stocké — toute tentative de refresh échouera
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });
  }
  res.clearCookie('refreshToken');
  ApiResponse.success(res, null, 'Déconnexion réussie');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('Refresh token manquant');
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('+refreshTokenHash');

  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Session invalide');
  }

  // Vérification cryptographique du refreshToken contre le hash stocké
  const isValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isValid) {
    throw ApiError.unauthorized('Session invalide');
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const newRefreshToken = generateRefreshToken(user._id.toString());

  // Rotation du hash à chaque refresh (défense contre token theft)
  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 8);
  await user.save();

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.success(res, {
    accessToken,
    ...(isMobile(req) && { refreshToken: newRefreshToken }),
  }, 'Token renouvelé');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return ApiResponse.success(res, null, 'Si un compte existe, un email a été envoyé');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    const template = emailTemplates.resetPassword(user.firstName, resetUrl);
    await sendEmail({ to: email, ...template });
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  ApiResponse.success(res, null, 'Si un compte existe, un email a été envoyé');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Token invalide ou expiré');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  ApiResponse.success(res, null, 'Mot de passe réinitialisé avec succès');
});

export const socialAuthCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
  user.lastLogin = new Date();
  await user.save();

  // refreshToken en cookie HttpOnly (strict — plus de lax maintenant que le JWT n'est plus dans l'URL)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Génère un code OTP usage unique (30s) stocké dans Redis
  const otpCode = crypto.randomBytes(32).toString('hex');
  const otpPayload = JSON.stringify({
    accessToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
  await redis.setex(`${OTP_PREFIX}${otpCode}`, OTP_TTL_SECONDS, otpPayload);

  res.redirect(`${env.CLIENT_URL}/auth/social/callback?code=${otpCode}`);
});

/** Échange le code OTP OAuth contre le vrai accessToken — usage unique, 30s de validité */
export const socialExchange = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    throw ApiError.badRequest('Code OAuth manquant');
  }

  // Lecture Redis — le TTL gère l'expiration automatiquement
  const raw = await redis.get(`${OTP_PREFIX}${code}`);
  if (!raw) {
    throw ApiError.unauthorized('Code OTP expiré ou invalide');
  }

  // Usage unique — suppression immédiate après lecture
  await redis.del(`${OTP_PREFIX}${code}`);

  const entry = JSON.parse(raw) as { accessToken: string; user: object };

  ApiResponse.success(res, {
    accessToken: entry.accessToken,
    user: entry.user,
  }, 'Connexion OAuth réussie');
});
