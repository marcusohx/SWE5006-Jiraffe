import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuthRecord extends User {
  passwordHash: string;
}

export interface CreateUserRepositoryInput {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

export interface UpdateUserRepositoryInput {
  name?: string;
  role?: UserRole;
  passwordHash?: string;
}

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ["user", "admin"], default: "user" },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserModel: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema);
