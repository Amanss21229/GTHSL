import { db } from "./db";
import { users, tests, questions, attempts, chatMessages } from "@shared/schema";
import type { User, Test, Question, Attempt, ChatMessage } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTests(): Promise<Test[]>;
  createTest(test: any): Promise<Test>;
  getUsers(): Promise<User[]>;
  getVerifiedUserUids(): Promise<string[]>;
  updateUserVerification(uid: string, isVerified: boolean): Promise<User>;
  getOrCreateUser(user: any): Promise<User>;
  getUserByFirebaseUid(uid: string): Promise<User | undefined>;
  updateUserChatLimit(uid: string, count: number, date: string): Promise<void>;
  getAttemptsByUserId(userId: number): Promise<Attempt[]>;
  getAllAttempts(): Promise<(Attempt & { userName: string, userEmail: string, testTitle: string })[]>;
}

export class DatabaseStorage implements IStorage {
  async getTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }
  
  async createTest(test: any): Promise<Test> {
    const [newTest] = await db.insert(tests).values(test).returning();
    return newTest;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getVerifiedUserUids(): Promise<string[]> {
    const verified = await db.select({ uid: users.firebaseUid }).from(users).where(eq(users.isVerified, true));
    return verified.map(u => u.uid);
  }

  async updateUserVerification(uid: string, isVerified: boolean): Promise<User> {
    const [updated] = await db.update(users)
      .set({ isVerified })
      .where(eq(users.firebaseUid, uid))
      .returning();
    return updated;
  }

  async getUserByFirebaseUid(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, uid));
    return user;
  }

  async updateUserChatLimit(uid: string, count: number, date: string): Promise<void> {
    await db.update(users)
      .set({ dailyMessageCount: count, lastMessageDate: date })
      .where(eq(users.firebaseUid, uid));
  }

  async getAttemptsByUserId(userId: number): Promise<Attempt[]> {
    return await db.select().from(attempts).where(eq(attempts.userId, userId));
  }

  async getAllAttempts(): Promise<(Attempt & { userName: string, userEmail: string, testTitle: string })[]> {
    const results = await db
      .select({
        attempt: attempts,
        userName: users.name,
        userEmail: users.email,
        testTitle: tests.title,
      })
      .from(attempts)
      .innerJoin(users, eq(attempts.userId, users.id))
      .innerJoin(tests, eq(attempts.testId, tests.id));
    
    return results.map(r => ({
      ...r.attempt,
      userName: r.userName,
      userEmail: r.userEmail,
      testTitle: r.testTitle,
    }));
  }

  async getOrCreateUser(userData: any): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.firebaseUid, userData.firebaseUid));
    if (existing) return existing;
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }
}

export const storage = new DatabaseStorage();