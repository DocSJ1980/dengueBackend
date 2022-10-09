// Imports (express, named imports from userControlller)
import express from "express"
import { fetchAllTowns, batchTown } from "../controllers/townController.js"
import { isAuthenticated } from "../middleware/auth.js"
import { upload } from "../utils/csvUploader.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.get("/fetchall", isAuthenticated, fetchAllTowns)
router.post("/batch", isAuthenticated, upload.single('csvFile'), batchTown)

// Export (default)
export default router