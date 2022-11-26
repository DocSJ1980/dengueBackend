// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import { PolioDay, Street } from "../models/polioTeamModel.js"
import ErrorResponse from "../utils/Error.js"
import path from 'path'
import fs from 'fs'
import { URL } from "url"
import { getData } from "../utils/getDataFromID.js";
import { filePath } from "../utils/filePath.js";

//. FIRST ROUTE: Add details to Dengue Day
export const fillPolioDay = async (req, res, next) => {
    try {
        const { foundUC, foundAic, foundPolioTeam, foundPolioDay, foundStreet } = await getData(req.body.polioDayID)

        const images = req.files
        const wpImgs = images.wayPointImgs
        if (req.aic._id.equals(foundAic._id)) {

            //* Updating area detail
            if (req.body.areaDetails) {
                // console.log(req.body.areaDetails)
                foundPolioDay.area = req.body.areaDetails
                await foundPolioDay.save()
                console.log("areaDetails check pass")
            }

            //* Saving Start Image to appropriate folder, deleting old images and Updating image location in database
            if (images.start[0]) {
                const startingLocation = { type: "Point", coordinates: [req.body.startLong, req.body.startLat] }
                console.log("startingPoint check pass")
                let imgType = "startImg"
                let ext = path.extname(images.start[0].originalname)
                let imgName = Date.now() + ext
                const startImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, foundStreet, imgType) + imgName
                console.log(foundPolioDay.startingPoint.startingImg)
                //* Deleting images from storage through locations in database
                if (foundPolioDay.startingPoint.startingImg) {
                    console.log("Starting image delete block reached")
                    const fileDir = new URL("../" + foundPolioDay.startingPoint.startingImg, import.meta.url)
                    // console.log(fileDir.pathname)
                    await fs.promises.unlink(fileDir.pathname, (err) => {
                        if (err) {
                            console.log(err)
                        } else { console.log("Starting Image deleted successfully") }
                    })
                }
                //* Adding images to storage properly in pre-defined folder structure and saving/updating their locations in database 
                await fs.promises.writeFile(startImgPath, images.start[0].buffer)
                console.log(startImgPath, startingLocation)
                foundPolioDay.startingPoint.startingImg = startImgPath
                foundPolioDay.startingPoint.startingLocation = startingLocation
                await foundPolioDay.save()
            }

            //* Saving End Image to appropriate folder, deleting old images and Updating image location in database
            if (images.end[0]) {
                let imgType = "endImg"
                const endingLocation = { type: "Point", coordinates: [req.body.endLong, req.body.endLat] }
                let ext = path.extname(images.end[0].originalname)
                let imgName = Date.now() + ext
                const endImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, foundStreet, imgType) + imgName
                console.log(endImgPath)
                //* Deleting images from storage through locations in database
                if (foundPolioDay.endingPoint.endingImg) {
                    console.log("Ending image delete block reached")
                    const fileDir = new URL("../" + foundPolioDay.endingPoint.endingImg, import.meta.url)
                    // console.log(fileDir.pathname)
                    await fs.promises.unlink(fileDir.pathname, (err) => {
                        if (err) {
                            console.log(err)
                        } else { console.log("Ending Image deleted successfully") }
                    })
                }
                //* Adding images to storage properly in pre-defined folder structure and saving/updating their locations in database 
                await fs.promises.writeFile(endImgPath, images.end[0].buffer)
                foundPolioDay.endingPoint.endingImg = endImgPath
                foundPolioDay.endingPoint.endingLocation = endingLocation
                await foundPolioDay.save()
                console.log("endingPoint check pass")
            }

            //* Saving Waypoint Images to appropriate folder, deleting old images and Updating image location in database
            if (wpImgs.length > 0) {
                let imgType = "wayPointImgs"
                const wayPointLong = req.body.wayPointLong
                const wayPointLat = req.body.wayPointLat

                //* Deleting images from storage through locations in database
                for (let i = 0; i < foundPolioDay.wayPoints.length; i++) {
                    // console.log(wayPoint)
                    // console.log("Waypoint delete block reached")
                    const delImg = foundPolioDay.wayPoints[i].wayPointImg
                    if (delImg) {
                        const fileDir = new URL("../" + delImg, import.meta.url)
                        console.log("Waypoint delete block reached")
                        await fs.promises.unlink(fileDir.pathname, (err) => {
                            if (err) {
                                console.log(err)
                            } else { console.log("Waypoint Image deleted successfully") }
                        })
                    }
                }
                //* Adding images to storage properly in pre-defined folder structure and saving/updating their locations in database 
                let j = 0
                foundPolioDay.wayPoints = []
                let wayPoints = []
                // console.log(wpImgs)
                for (const img of wpImgs) {
                    let ext = path.extname(img.originalname)
                    let imgName = Date.now() + ext
                    // const wayPointLocation = { coordinates: [wayPointLong[j], wayPointLat[j]] }
                    const wpImg = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, foundStreet, imgType) + imgName
                    // conspe.log(wpImg, wayPointLocation)
                    // console.log(wayPoints)
                    await fs.promises.writeFile(wpImg, img.buffer)
                    wayPoints.push({ wayPointImg: wpImg, wayPointLocation: { type: "Point", coordinates: [wayPointLong[j], wayPointLat[j]] } })
                    // console.log(wayPoints)
                    j++
                }
                foundPolioDay.wayPoints = wayPoints
                await foundPolioDay.save()
                console.log("wayPoint check pass")
            }
            res.status(200).json("Update Polio Day: Operation successful.");
        } else {
            return next(new ErrorResponse("Update Polio Day: Requested Operation Failed (You are not area incharege of requested polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("Update Polio Day: Requested Operation Failed (Internal Server Error)", 409))
    }
};

//. 2nd Route: Create New Street
export const createNewStreet = async (req, res, next) => {
    const { foundAic, foundPolioDay } = await getData(req.body.polioDayID)

    try {
        if (req.aic._id.equals(foundAic._id)) {
            if (foundPolioDay.street.length < 5) {
                const street = await Street.create({})
                foundPolioDay.street.push(street._id)
                await foundPolioDay.save({})
                res.status(200).json("Create new Street: Operation successful")
            } else {
                return next(new ErrorResponse("Update Polio Day: Requested Operation Failed (Creating more than 5 streets in a polio day are not allowed. Please contact District Dengue Cell!).", 403))
            }
        } else {
            return next(new ErrorResponse("Update Polio Day: Requested Operation Failed (You are not area incharege of requested polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("Create new Street: Requested Operation Failed", 409))
    }
}