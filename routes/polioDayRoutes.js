// Imports (express, named imports from userControlller)
import express, { Router } from "express"
import { createNewHouse, createNewSpot, deleteHouse, deleteHouseHold, fillPolioDay, updateHouse, updateHouseHold, updateSpot } from "../controllers/polioDayController.js"
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
router.post("/spot/new", isTeam, uploadImg.single('spotFrontImg'), createNewSpot)
router.post("/house/update", isTeam, updateHouse)
router.post("/spot/update", isTeam, updateSpot)
router.delete("/house/delete", isTeam, deleteHouse)
router.post("/household/update", isTeam, updateHouseHold)
router.delete("/household/delete", isTeam, deleteHouseHold)


// Export (default)
export default router