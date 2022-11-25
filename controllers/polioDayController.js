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
        const { foundUC, foundAic, foundPolioTeam, foundPolioDay, street } = await getData(req.body.polioDayID)
        const images = req.files
        const wayPoint = images.wayPointImgs
        //TODO: accept locations
        //TODO: check logic of if and else only first condition running
        //* Updating area detail
        if (req.body.areaDetails) {
            console.log(req.body.areaDetails)
            foundPolioDay.area = req.body.areaDetails
            await foundPolioDay.save()
        }

        //* Saving Start Image to appropriate folder and Updating image location in database
        if (images.start[0]) {
            let imgType = "startImg"
            let ext = path.extname(images.start[0].originalname)
            let imgName = Date.now() + ext
            const startImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) + imgName
            console.log(startImgPath)
            await fs.promises.writeFile(startImgPath, images.start[0].buffer)
            foundPolioDay.startingImg = startImgPath
            await foundPolioDay.save()
        }

        //* Saving End Image to appropriate folder and Updating image location in database
        if (images.end[0]) {
            let imgType = "endImg"
            let ext = path.extname(images.end[0].originalname)
            let imgName = Date.now() + ext
            const endImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) + imgName
            console.log(endImgPath)
            await fs.promises.writeFile(endImgPath, images.end[0].buffer)
            foundPolioDay.endingImg = endImgPath
            await foundPolioDay.save()
        }

        //* Saving Waypoint Images to appropriate folder and Updating image location in database
        if (wayPoint.length > 0) {
            let imgType = "wayPointImgs"
            foundPolioDay.wayPointImgs = []
            for (const img of wayPoint) {
                let ext = path.extname(img.originalname)
                let imgName = Date.now() + ext
                const wayPointImg = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) + imgName
                console.log(wayPointImg)
                foundPolioDay.wayPointImgs.push(wayPointImg)
                await fs.promises.writeFile(wayPointImg, img.buffer)
                await foundPolioDay.save()
            }
        }
        res.status(200).json(foundPolioDay);
    } catch (error) {
        res.status(404).json("Polio Day Update: Operation Failed")
    }
};
