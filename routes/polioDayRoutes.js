// Imports (express, named imports from userControlller)
import express from "express"
import { fillPolioDay } from "../controllers/polioDayController.js"
import { isAic } from "../middleware/aicAuth.js";
import { uploadImg } from "../utils/imgUploader.js";

// Consts (initializing router)
const router = express.Router()

// User Routes
router.put("/fill", isAic, uploadImg.fields([{ name: "start", maxCount: 1 }, { name: "end", maxCount: 1 }, { name: "wayPointImgs", maxCount: 5 }]), fillPolioDay)


// Export (default)
export default router