import mongoose, { Schema } from "mongoose";

const RewardRuleSchema = new Schema({
  coinsPerAward: { type: Number, default: 500, min: 0 },
  xpPerAward: { type: Number, default: 1000, min: 0 },
  coinsPerStudentPerDay: { type: Number, default: 1000, min: 0 },
  xpPerStudentPerDay: { type: Number, default: 2000, min: 0 },
}, { _id: false });

const SchoolSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  timezone: { type: String, default: "Asia/Dubai" },
  settings: {
    allowUsernameSearch: { type: Boolean, default: true },
    allowCoinGifts: { type: Boolean, default: true },
    allowClassChat: { type: Boolean, default: true },
    allowTradingTerminal: { type: Boolean, default: true },
    allowCribbyAI: { type: Boolean, default: true },
    allowLeaderboards: { type: Boolean, default: true },
    leaderboardScope: { type: String, enum: ["class", "year", "school"], default: "class" },
    coinGiftPerTransferCap: { type: Number, default: 500, min: 1 },
    coinGiftPerDayCap: { type: Number, default: 1000, min: 1 },
    rewardsByTaskType: {
      homework: { type: RewardRuleSchema, default: () => ({}) },
      green: { type: RewardRuleSchema, default: () => ({ coinsPerAward: 250, xpPerAward: 500, coinsPerStudentPerDay: 500, xpPerStudentPerDay: 1000 }) },
      physical: { type: RewardRuleSchema, default: () => ({ coinsPerAward: 250, xpPerAward: 500, coinsPerStudentPerDay: 500, xpPerStudentPerDay: 1000 }) },
      activity: { type: RewardRuleSchema, default: () => ({ coinsPerAward: 250, xpPerAward: 500, coinsPerStudentPerDay: 500, xpPerStudentPerDay: 1000 }) },
    },
    behavior: {
      categories: {
        type: [{ name: { type: String, required: true, maxlength: 80 }, defaultPoints: { type: Number, required: true, min: -100, max: 100 } }],
        default: [{ name: "Positive contribution", defaultPoints: 1 }, { name: "Needs improvement", defaultPoints: -1 }],
      },
      maxPointsPerEntry: { type: Number, default: 10, min: 1 },
      pointsPerStudentPerDay: { type: Number, default: 20, min: 1 },
      dailyCoinDeductionCap: { type: Number, default: 100, min: 0 },
      coinsPerNegativePoint: { type: Number, default: 0, min: 0 },
      coinsPerPositivePoint: { type: Number, default: 0, min: 0 },
      adminApprovalAboveCap: { type: Boolean, default: true },
    },
    teams: { type: [String], default: [] },
    parentWeeklyEmailEnabled: { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.models.School || mongoose.model("School", SchoolSchema);
