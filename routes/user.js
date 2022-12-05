// Imports (express, named imports from userControlller)
import express from "express"
import { login, newUser, forgotPassword, resetPassword, verify, logout, getMyProfile, updateProfile, updatePassword, batchUsers, followUser, searchStaff } from "../controllers/userController.js"
import { assignStaff, removeStaff, setSuper, removeSuper, setEnto, removeEnto, setTownEnto, removeTownEnto, setDdho, removeDdho, assignAic, removeAic } from "../controllers/assignReleaseController.js"
import { isAuthenticated } from "../middleware/auth.js";
import { isSuper } from "../middleware/superAuth.js";
import { isTownEnto } from "../middleware/townEntoAuth.js";
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
router.put("/setaic", isSuper, assignAic)
router.put("/removeaic", isSuper, removeAic)
router.put("/setsuper", isTownEnto, setSuper)
router.put("/removesuper", isTownEnto, removeSuper)
router.put("/setento", isTownEnto, setEnto)
router.put("/removeento", isTownEnto, removeEnto)
router.put("/settownento", isAuthenticated, setTownEnto)
router.put("/removetownento", isAuthenticated, removeTownEnto)
router.put("/setddho", isTownEnto, setDdho)
router.put("/removeddho", isTownEnto, removeDdho)



// Export (default)
export default router