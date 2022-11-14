// Imports (express, named imports from userControlller)
import express from "express"
import { login, newUser, forgotPassword, resetPassword, verify, logout, getMyProfile, updateProfile, updatePassword, batchUsers, followUser, setSupervisor, assignStaff, searchStaff } from "../controllers/userController.js"
import { isAuthenticated } from "../middleware/auth.js";
import { isSuper } from "../middleware/superAuth.js";
import { upload } from "../utils/csvUploader.js"

// Consts (initializing router)
const router = express.Router()

// User Routes
router.post("/new", newUser)
router.post("/login", login)
router.get("/logout", logout)
router.post("/forgotpassword", forgotPassword)
router.post("/restpassword", resetPassword)

// Protected user routes
router.post("/verify", isAuthenticated, verify);
router.get("/me", isAuthenticated, getMyProfile);
router.post("/updateprofile", isAuthenticated, updateProfile);
router.post("/updatepassword", isAuthenticated, updatePassword);
router.post("/batch", upload.single('csvFile'), batchUsers)
router.get("/follow/:id", isAuthenticated, followUser)
router.put("/setsuper", isAuthenticated, setSupervisor)
router.post("/setstaff", isSuper, assignStaff)
router.get("/staff/:key", isAuthenticated, searchStaff)



// Export (default)
export default router