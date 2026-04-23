import dns from "node:dns/promises";
import mongoose from "mongoose";
import { env } from "@/lib/config";

declare global {
  var _mongooseConnection: Promise<typeof mongoose> | undefined; // NOSONAR
}

const dnsServers = process.env.DNS_SERVERS?.split(",").map((server) =>
  server.trim(),
);

let dnsConfigured = false;

function ensureDnsServers() {
  if (dnsConfigured || !dnsServers?.length) {
    return;
  }
  try {
    dns.setServers(dnsServers.filter(Boolean));
  } catch {
    // If DNS override fails, continue with system defaults.
  }
  dnsConfigured = true;
}

const connectionPromise =
  global._mongooseConnection ??
  (() => {
    ensureDnsServers();
    const promise = mongoose.connect(env.MONGODB_URI);
    global._mongooseConnection = promise;
    return promise;
  })();

export async function connectMongo() {
  return connectionPromise;
}
