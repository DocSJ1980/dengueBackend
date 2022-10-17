// Imports (express, named imports from userControlller)
import express from "express"
import { createTeams } from "../controllers/dengueTeamController.js"
import { isAuthenticated } from "../middleware/auth.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.post("/create", isAuthenticated, createTeams)

// Export (default)
export default router