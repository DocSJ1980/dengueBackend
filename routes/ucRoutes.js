// Imports (express, named imports from userControlller)
import express from "express"
import { fetchAllUCs, newUC, updateUC, deleteUC } from "../controllers/ucController.js"
import { isAuthenticated } from "../middleware/auth.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.post("/new", isAuthenticated, newUC)
router.get("/fetchall", isAuthenticated, fetchAllUCs)
router.post("/update/:id", isAuthenticated, updateUC)
router.delete("/delete/:id", isAuthenticated, deleteUC)

// Export (default)
export default router