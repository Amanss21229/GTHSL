import { db } from "./db";
import { users, tests, questions, attempts, chatMessages } from "@shared/schema";
import type { User, Test, Question, Attempt, ChatMessage } from "@shared/schema";

export interface IStorage {
  getTests(): Promise<Test[]>;
  createTest(test: any): Promise<Test>;
}

export class DatabaseStorage implements IStorage {
  async getTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }
  
  async createTest(test: any): Promise<Test> {
    const [newTest] = await db.insert(tests).values(test).returning();
    return newTest;
  }
}

export const storage = new DatabaseStorage();