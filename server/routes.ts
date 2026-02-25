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

      const prompt = `
        I have two texts extracted from PDFs. One is a question paper and the other is an answer key.
        Please extract the questions and their corresponding correct options (1-4).
        
        Question Paper Text:
        ${questionData.text.substring(0, 15000)}
        
        Answer Key Text:
        ${answerData.text.substring(0, 7000)}
        
        Return a JSON object with a "questions" key containing an array of objects:
        {
          "questions": [
            { "questionNumber": 1, "correctOption": 2, "imageUrl": "" },
            ...
          ]
        }
        Only return the JSON object.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
      res.status(500).json({ message: "Failed to extract questions: " + error.message });
    }
  });

  app.get(api.tests.list.path, async (req, res) => {
    const allTests = await storage.getTests();
    res.json(allTests);
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

  return httpServer;
}