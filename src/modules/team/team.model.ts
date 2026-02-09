import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export interface Team {
  id: string;
  teamId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface CreateTeamRepositoryInput {
  name: string;
  description?: string | null;
  memberIds: string[];
  isActive?: boolean;
}

export interface UpdateTeamRepositoryInput {
  name?: string;
  description?: string | null;
  memberIds?: string[];
  isActive?: boolean;
}

const teamSchema = new Schema(
  {
    team_id: { type: Number, required: true, unique: true },
    team_name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const userTeamSchema = new Schema(
  {
    team_id: { type: Number, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "member" },
  },
  { timestamps: true }
);

userTeamSchema.index({ team_id: 1, user_id: 1 }, { unique: true });

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export type TeamDocument = InferSchemaType<typeof teamSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const TeamModel: Model<TeamDocument> =
  mongoose.models.Team ?? mongoose.model<TeamDocument>("Team", teamSchema);

export type UserTeamDocument = InferSchemaType<typeof userTeamSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserTeamModel: Model<UserTeamDocument> =
  mongoose.models.UserTeam ?? mongoose.model<UserTeamDocument>("UserTeam", userTeamSchema);

export type CounterDocument = InferSchemaType<typeof counterSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CounterModel: Model<CounterDocument> =
  mongoose.models.Counter ?? mongoose.model<CounterDocument>("Counter", counterSchema);
