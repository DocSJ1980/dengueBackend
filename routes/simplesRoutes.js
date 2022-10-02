// Imports (express, named imports from userControlller)
import express from "express"
import { newSimpleActivity, fetchAllSimpleActivities, updateSimpleActivity, deleteSimpleActivity, likeUnlike } from "../controllers/simplesController.js"
import { isAuthenticated } from "../middleware/auth.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.post("/new", newSimpleActivity)
router.get("/simpleActivity/:id", isAuthenticated, likeUnlike)
router.get("/fetchasimpleactivity", fetchAllSimpleActivities)
router.post("/updatesimpleactivity", updateSimpleActivity)
router.post("/deletesimpleactivity", deleteSimpleActivity)

// Export (default)
export default router