// Imports (express, named imports from userControlller)
import express from "express"
import { dtCreate } from "../controllers/dengueTeamController.js"
import { polioMPGen, polioMPPurge } from "../controllers/polioTeamController.js"
import { isAuthenticated } from "../middleware/auth.js"

// Consts (initializing router)
const router = express.Router()

// Dengue Routes
router.post("/dtcreate", isAuthenticated, dtCreate)
router.post("/poliompgen", isAuthenticated, polioMPGen)
router.get("/poliomppurge", isAuthenticated, polioMPPurge)


// Export (default)
export default router