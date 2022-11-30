// Imports (express, named imports from userControlller)
import express, { Router } from "express"
import { createNewHouse, fillPolioDay, updateHouse, updateHouseHold } from "../controllers/polioDayController.js"
import { isAic } from "../middleware/aicAuth.js";
import { isTeam } from "../middleware/teamAuth.js";
import { uploadImg } from "../utils/imgUploader.js";

// Consts (initializing router)
const router = express.Router()

// User Routes
router.put("/fill", isAic, uploadImg.fields([
    { name: "start", maxCount: 1 },
    { name: "end", maxCount: 1 },
    { name: "wayPointImgs", maxCount: 5 }]), fillPolioDay)
router.post("/house/new", isTeam, uploadImg.single('houseFrontImg'), createNewHouse)
router.post("/house/update", isTeam, updateHouse)
router.post("/household/update", isTeam, updateHouseHold)


// Export (default)
export default router