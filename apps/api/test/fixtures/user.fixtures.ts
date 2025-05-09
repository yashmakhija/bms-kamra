import { User, Admin } from "@repo/database";

// Create a mock regular user
export const createMockUser = (id?: string): User => {
  return {
    id: id || `user-${Date.now()}`,
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    emailVerified: new Date(),
    password: "$2a$10$abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyzAB", // hashed 'password123'
    phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    phoneVerified: true,
    image: "https://example.com/avatar.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    isAdmin: false,
  };
};

// Create a mock admin user
export const createMockAdminUser = (id?: string): User => {
  return {
    id: id || `admin-${Date.now()}`,
    name: "Test Admin",
    email: `admin-${Date.now()}@example.com`,
    emailVerified: new Date(),
    password: "$2a$10$abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyzAB", // hashed 'password123'
    phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    phoneVerified: true,
    image: "https://example.com/admin-avatar.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    isAdmin: true,
  };
};

// Create a mock admin entry
export const createMockAdmin = (
  userId: string,
  role: string = "EDITOR"
): Admin => {
  return {
    id: `admin-record-${Date.now()}`,
    userId,
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
