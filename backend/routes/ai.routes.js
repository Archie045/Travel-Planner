import { Router } from "express";
import { generateItinerary } from "../controllers/ai.controller.js"; // Adjusted path to controllers

const router = Router();

router.post('/generate-itenary',generateItinerary);


export default router;

