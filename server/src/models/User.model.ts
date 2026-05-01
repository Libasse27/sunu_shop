import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  _id?:         mongoose.Types.ObjectId;
  fullName:     string;
  phone:        string;
  street:       string;
  city:         string;
  region?:      string;
  country:      string;
  postalCode?:  string;
  isDefault:    boolean;
  label:        'domicile' | 'bureau' | 'autre';
  deleteOne?:   () => void;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  avatar: string;
  role: 'client' | 'admin' | 'superadmin';
  googleId?: string;
  facebookId?: string;
  authProvider: 'local' | 'google' | 'facebook';
  isVerified: boolean;
  isActive: boolean;
  addresses: IAddress[];
  wishlist: mongoose.Types.ObjectId[];
  refreshTokenHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verificationToken?: string;
  verificationExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  preferences: {
    language: 'fr' | 'en';
    currency: 'XOF' | 'EUR' | 'USD';
    newsletter: boolean;
    notifications: { email: boolean; sms: boolean };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

const AddressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  region: String,
  country: { type: String, default: 'Sénégal' },
  postalCode: String,
  isDefault: { type: Boolean, default: false },
  label: { type: String, enum: ['domicile', 'bureau', 'autre'], default: 'domicile' },
}, { _id: true });

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: function(this: IUser) { return this.authProvider === 'local'; }, minlength: 8, select: false },
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['client', 'admin', 'superadmin'], default: 'client' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  addresses: [AddressSchema],
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  refreshTokenHash: { type: String, select: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationToken: String,
  verificationExpires: Date,
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  preferences: {
    language: { type: String, enum: ['fr', 'en'], default: 'fr' },
    currency: { type: String, enum: ['XOF', 'EUR', 'USD'], default: 'XOF' },
    newsletter: { type: Boolean, default: true },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
}, { timestamps: true });

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1, role: 1, createdAt: -1 });           // liste utilisateurs admin
UserSchema.index({ resetPasswordToken: 1 }, { sparse: true });       // findOne({ resetPasswordToken })
UserSchema.index({ verificationToken: 1 }, { sparse: true });        // findOne({ verificationToken })

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.password = undefined;
    ret.refreshTokenHash = undefined;
    ret.__v = undefined;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
