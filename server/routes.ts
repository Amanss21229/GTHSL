import express, { type Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  }, express.static(uploadDir));

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/admin/extract-questions", upload.fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'answerKey', maxCount: 1 }
  ]), async (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.questionPaper || !files.answerKey) {
      return res.status(400).json({ message: "Both question paper and answer key PDFs are required" });
    }

    try {
      const questionData = await pdf(fs.readFileSync(files.questionPaper[0].path));
      const answerData = await pdf(fs.readFileSync(files.answerKey[0].path));

      // Optimize: Only take what's likely needed for the prompt to stay within token limits and be faster
      const qText = questionData.text.substring(0, 12000);
      const aText = answerData.text.substring(0, 5000);

      const prompt = `Extract questions and correct options (1-4) from these texts.
      Question Paper: ${qText}
      Answer Key: ${aText}
      Return JSON: {"questions": [{"questionNumber": 1, "correctOption": 2, "imageUrl": ""}]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Faster and cheaper
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      console.log("AI Response:", content);
      const result = JSON.parse(content || "{}");
      const questions = result.questions || (Array.isArray(result) ? result : []);

      res.json({ questions });
    } catch (error: any) {
      console.error("Extraction failed:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get(api.tests.list.path, async (req, res) => {
    const allTests = await storage.getTests();
    res.json(allTests);
  });

  app.get("/api/tests/:id", async (req, res) => {
    const testId = parseInt(req.params.id);
    const allTests = await storage.getTests();
    const test = allTests.find(t => t.id === testId);
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  });

  app.get("/api/users", async (req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers);
  });

  app.post("/api/users", async (req, res) => {
    const user = await storage.getOrCreateUser(req.body);
    res.json(user);
  });

  app.get("/api/users/verified", async (req, res) => {
    const verifiedUsers = await storage.getVerifiedUserUids();
    res.json(verifiedUsers);
  });

  app.patch("/api/users/:uid/verify", async (req, res) => {
    const { isVerified } = req.body;
    const updatedUser = await storage.updateUserVerification(req.params.uid, isVerified);
    res.json(updatedUser);
  });

  app.get("/api/admin/stats", async (_req, res) => {
    const users = await storage.getUsers();
    const tests = await storage.getTests();
    const attempts = await storage.getAllAttempts();
    
    res.json({
      totalUsers: users.length,
      totalTests: tests.length,
      totalAttempts: attempts.length,
      attempts: attempts
    });
  });

  app.post("/api/users/:uid/check-chat-limit", async (req, res) => {
    const { uid } = req.params;
    const user = await storage.getUserByFirebaseUid(uid);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (user.isVerified) {
      return res.json({ allowed: true });
    }

    const today = new Date().toISOString().split('T')[0];
    if (user.lastMessageDate !== today) {
      await storage.updateUserChatLimit(uid, 1, today);
      return res.json({ allowed: true, remaining: 199 });
    }

    if ((user.dailyMessageCount || 0) >= 200) {
      return res.json({ allowed: false, remaining: 0 });
    }

    await storage.updateUserChatLimit(uid, (user.dailyMessageCount || 0) + 1, today);
    return res.json({ allowed: true, remaining: 200 - (user.dailyMessageCount || 0) - 1 });
  });

  return httpServer;
}