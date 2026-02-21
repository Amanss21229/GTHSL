import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.tests.list.path, async (req, res) => {
    const allTests = await storage.getTests();
    res.json(allTests);
  });

  return httpServer;
}