import mongoose from "mongoose";
import { env } from "@/lib/config";

declare global {
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

const connectionPromise =
  global._mongooseConnection ??
  (() => {
    const promise = mongoose.connect(env.MONGODB_URI);
    global._mongooseConnection = promise;
    return promise;
  })();

export async function connectMongo() {
  return connectionPromise;
}
