// Imports (express, named imports from userControlller)
import express from "express"
import { fetchAllUCs, newUC, updateUC, deleteUC, batchUCs } from "../controllers/ucController.js"
import { isAuthenticated } from "../middleware/auth.js"
import { upload } from "../utils/csvUploader.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.post("/new", isAuthenticated, newUC)
router.get("/fetchall", isAuthenticated, fetchAllUCs)
router.post("/update/:id", isAuthenticated, updateUC)
router.delete("/delete/:id", isAuthenticated, deleteUC)
router.post("/batch", isAuthenticated, upload.single('csvFile'), batchUCs)

// Export (default)
export default router