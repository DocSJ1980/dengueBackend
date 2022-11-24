// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import { PolioDay, Street } from "../models/polioTeamModel.js"
import ErrorResponse from "../utils/Error.js"
import path from 'path'
import fs from 'fs'
import { getData } from "../utils/getDataFromID.js";
import { filePath } from "../utils/filePath.js";

//. FIRST ROUTE: Add details to Dengue Day
export const fillPolioDay = async (req, res, next) => {
    try {
        const { street, foundUC, foundAic, foundPolioTeam, foundPolioDay } = await getData(req.body.polioDayID)
        const images = req.files
        const wayPoint = images.wayPointImgs

        if (images.start[0]) {
            let imgType = "startImg"
            let ext = path.extname(images.start[0].originalname)
            let imgName = Date.now() + ext
            console.log(ext)
            const startImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) + imgName
            console.log(startImgPath)
            await fs.promises.writeFile(startImgPath, images.start[0].buffer)
            foundPolioDay.startingImg = startImgPath
        } else if (images.end[0]) {
            let imgType = "endImg"
            let ext = path.extname(images.end[0].originalname)
            imgName = Date.now() + ext
            const endImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) + imgName
            console.log(endImgPath)
            await fs.promises.writeFile(endImgPath, images.end[0].buffer)
            foundPolioDay.endingImg = endImgPath
        } else if (wayPoint.length > 0) {
            let imgType = "wayPointImgs"
            foundPolioDay.wayPointImgs = []
            for (const img of wayPoint) {
                let ext = path.extname(img.originalname)
                imgName = Date.now() + ext
                const wayPointImg = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) + imgName
                console.log(wayPointImg)
                foundPolioDay.wayPointImgs.push(wayPointImg)
                await fs.promises.writeFile(wayPointImg, img.buffer)
            }
        }
        await foundPolioDay.save()
        res.status(200).json(foundPolioDay);
    } catch (error) {
        res.status(404).json("Polio Day Update: Operation Failed")
    }
};
