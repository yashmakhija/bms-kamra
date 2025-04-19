// Re-export everything from @repo/database for convenience
export * from "@repo/database";

// Import and re-export prisma client from our local singleton
import { prisma } from "./prisma";
export { prisma };
