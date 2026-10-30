import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  role: {
    type: String,
    enum: ['Teacher', 'Student', 'SchoolAdmin', 'Parent'],
    default: 'Student',
  },
  dob: {
    type: Date,
  },
  parentEmail: {
    type: String,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 254,
  },
  school: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    index: true,
  },
  schoolYear: {
    type: String,
    trim: true,
    maxlength: 40,
  },
  team: {
    type: String,
    trim: true,
    maxlength: 80,
  },
  // Student specific stats
  coins: {
    type: Number,
    default: 1000,
  },
  behaviorPointLockVersion: {
    type: Number,
    default: 0,
  },
  xp: {
    type: Number,
    default: 0,
  },
  greenXp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  socialStreak: {
    type: Number,
    default: 0,
  },
  // Virtual Home State
  homeLevel: {
    type: Number,
    default: 1,
  },
  assets: {
    gold: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    cnc500: { type: Number, default: 0 },
    business: { type: Number, default: 0 },
    property: { type: Number, default: 0 },
  },
  // Billing and Needs (Flattened)
  electricityStatus: { type: String, default: 'Active' },
  lastElectricityPaid: { type: Date, default: Date.now },
  waterStatus: { type: String, default: 'Active' },
  lastWaterPaid: { type: Date, default: Date.now },
  billingCycle: { type: Date, default: Date.now },
  lastTaxPaid: { type: Date, default: () => new Date(Date.now() + 23 * 24 * 60 * 60 * 1000) },
  taxStatus: { type: String, default: 'Paid' },
  isTaxRaidPending: { type: Boolean, default: false },
  lastFinedAt: { type: Date, default: null },
  lastGreenClaim: { type: Date, default: null },
  greenClaims: [{
    actionId: { type: String, required: true },
    dateKey: { type: String, required: true },
    claimedAt: { type: Date, default: Date.now },
  }],
  giftsSentToday: { type: Number, default: 0 },
  giftsDateKey: { type: String, default: '' },
  sustainabilityPoints: { type: Number, default: 0 },
  hasCompletedTutorial: { type: Boolean, default: false },
  weeklyEarnings: { type: Number, default: 0 },
  lastWeeklyReset: { type: Date, default: Date.now },
  weeklyCap: { type: Number, default: 5000 },
  lastEcoReset: { type: Date, default: Date.now },


  workspaces: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  classes: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  // Social & Challenges
  privateMode: {
    type: Boolean,
    default: false,
  },
  lastChallengeReset: {
    type: Date,
    default: Date.now,
  },
  currentChallenge: [{
    category: { type: String, enum: ['Academic', 'Eco', 'Physical'] },
    title: { type: String },
    target: { type: Number, default: 1 },
    current: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  }],
  purchasedItems: {
    type: [String],
    default: [],
  },
  lastViewedLevel: {
    type: Number,
    default: 1,
  },
  interiorLayout: {
    type: Object,
    default: {},
  },
  scratchpad: {
    type: String,
    default: "",
  },
  badges: [{
    label: String,
    icon: String,
    color: String,
    awardedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true, strict: false });

if (models.User) {
  delete models.User;
}
const User = model('User', UserSchema);

export default User;
