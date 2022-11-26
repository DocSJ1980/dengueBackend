// Imports (express, named imports from userControlller)
import express, { Router } from "express"
import { createNewStreet, fillPolioDay } from "../controllers/polioDayController.js"
import { isAic } from "../middleware/aicAuth.js";
import { uploadImg } from "../utils/imgUploader.js";

// Consts (initializing router)
const router = express.Router()

// User Routes
router.put("/fill", isAic, uploadImg.fields([
    { name: "start", maxCount: 1 },
    { name: "end", maxCount: 1 },
    { name: "wayPointImgs", maxCount: 5 }]), fillPolioDay)
router.post("/street/new", isAic, createNewStreet)


// Export (default)
export default router