// Imports (express, named imports from userControlller)
import express from "express"
import { assignStaffDT, dtCreate, removeStaffDT } from "../controllers/dengueTeamController.js"
import { polioMPGen, polioMPPurge } from "../controllers/polioTeamController.js"
import { isAuthenticated } from "../middleware/auth.js"
import { isSuper } from "../middleware/superAuth.js"

// Consts (initializing router)
const router = express.Router()

// Dengue Routes
router.get("/dtcreate", isSuper, dtCreate)
router.put("/assignstaffdt", isSuper, assignStaffDT)
router.put("/removestaffdt", isSuper, removeStaffDT)
router.put("/poliompgen", isAuthenticated, polioMPGen)
router.get("/poliomppurge", isAuthenticated, polioMPPurge)


// Export (default)
export default router