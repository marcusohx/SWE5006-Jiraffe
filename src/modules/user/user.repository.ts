import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongodb";
import type {
  CreateUserRepositoryInput,
  UpdateUserRepositoryInput,
  User,
  UserAuthRecord,
} from "@/modules/user/user.model";
import { UserModel, type UserDocument } from "@/modules/user/user.model";

function mapUser(doc: UserDocument): UserAuthRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapPublicUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createUser(data: CreateUserRepositoryInput): Promise<UserAuthRecord> {
  await connectMongo();
  const created = await UserModel.create({
    email: data.email,
    name: data.name,
    role: data.role,
    passwordHash: data.passwordHash,
  });
  return mapUser(created);
}

export async function findUserById(id: string): Promise<UserAuthRecord | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const user = await UserModel.findById(id);
  return user ? mapUser(user) : null;
}

export async function findUserByEmail(email: string): Promise<UserAuthRecord | null> {
  await connectMongo();
  const user = await UserModel.findOne({ email });
  return user ? mapUser(user) : null;
}

export async function listUsers(): Promise<User[]> {
  await connectMongo();
  const users = await UserModel.find().sort({ createdAt: -1 });
  return users.map((user) => mapPublicUser(user));
}

export async function updateUserById(
  id: string,
  updates: UpdateUserRepositoryInput
): Promise<UserAuthRecord | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const updated = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
  return updated ? mapUser(updated) : null;
}

export async function deleteUserById(id: string): Promise<boolean> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  const result = await UserModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
