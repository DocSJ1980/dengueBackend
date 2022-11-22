// Imports (express, named imports from userControlller)
import express from "express"
import { login, newUser, forgotPassword, resetPassword, verify, logout, getMyProfile, updateProfile, updatePassword, batchUsers, followUser, assignStaff, searchStaff, removeStaff, setSuper, removeSuper, setEnto, removeEnto, setTownEnto, removeTownEnto, setDdho, removeDdho } from "../controllers/userController.js"
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
router.get("/staff/:key", isAuthenticated, searchStaff)

// Set-Release routes
router.put("/setstaff", isSuper, assignStaff)
router.put("/removestaff", isSuper, removeStaff)
router.put("/setsuper", isAuthenticated, setSuper)
router.put("/removesuper", isAuthenticated, removeSuper)
router.put("/setento", isAuthenticated, setEnto)
router.put("/removeento", isAuthenticated, removeEnto)
router.put("/settownento", isAuthenticated, setTownEnto)
router.put("/removetownento", isAuthenticated, removeTownEnto)
router.put("/setddho", isAuthenticated, setDdho)
router.put("/removeddho", isAuthenticated, removeDdho)



// Export (default)
export default router