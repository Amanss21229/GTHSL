import express, { type Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import multer from "multer";
import path from "path";
import fs from "fs";

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