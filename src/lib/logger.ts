export type LogMeta = Record<string, unknown>;

export const logger = {
  info(message: string, meta?: LogMeta) {
    if (meta) {
      console.log(`[info] ${message}`, meta);
      return;
    }
    console.log(`[info] ${message}`);
  },
  warn(message: string, meta?: LogMeta) {
    if (meta) {
      console.warn(`[warn] ${message}`, meta);
      return;
    }
    console.warn(`[warn] ${message}`);
  },
  error(message: string, meta?: LogMeta) {
    if (meta) {
      console.error(`[error] ${message}`, meta);
      return;
    }
    console.error(`[error] ${message}`);
  },
};
