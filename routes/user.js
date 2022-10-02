// Imports (express, named imports from userControlller)
import express from "express"
import { login, newUser, forgotPassword, resetPassword, verify, logout, getMyProfile, updateProfile, updatePassword } from "../controllers/userController.js"
import { isAuthenticated } from "../middleware/auth.js";

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

// Export (default)
export default router