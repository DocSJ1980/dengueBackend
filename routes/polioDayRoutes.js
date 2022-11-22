// Imports (express, named imports from userControlller)
import express from "express"
import { fillPolioDay } from "../controllers/polioDayController.js"
import { isAuthenticated } from "../middleware/auth.js";
import { isSuper } from "../middleware/superAuth.js";
import { isTownEnto } from "../middleware/townEntoAuth.js";
import { upload } from "../utils/csvUploader.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.put("/fill", fillPolioDay)


// Export (default)
export default router