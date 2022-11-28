// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import { PolioDay } from "../models/polioTeamModel.js"
import ErrorResponse from "../utils/Error.js"
import path from 'path'
import fs from 'fs'
import { URL } from "url"
import { getData } from "../utils/getDataFromID.js";
import { filePath } from "../utils/filePath.js";
import { House, HouseHold } from "../models/sitesModel.js"

//. FIRST ROUTE: Add details to Dengue Day
export const fillPolioDay = async (req, res, next) => {
    try {
        console.log(req.body)
        const { foundUC, foundAic, foundPolioTeam, foundPolioDay } = await getData(req.body.polioDayID)

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
                const startImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, imgType) + imgName
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
                const endImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, imgType) + imgName
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
                    const wpImg = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, imgType) + imgName
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

//. 2nd Route: Create New House
export const createNewHouse = async (req, res, next) => {
    const { foundUC, foundAic, foundPolioTeam, foundPolioDay } = await getData(req.body.polioDayID)
    try {
        //* Authenticating if the reporting team is assigned to the polio day or not
        //* Authenticity of the team already checked in isTeam middleware in routes
        if (req.polioDay._id.equals(foundPolioDay._id)) {
            //* Getting information from the body
            const dhNo = req.body.dhNo
            const polioHouseNo = req.body.polioHouseNo
            const residentName = req.body.residentName
            const residentContact = req.body.residentContact
            const storeys = req.body.storeys
            const houseHolds = req.body.houseHolds
            const long = req.body.long
            const lat = req.body.lat
            const location = { type: "Point", coordinates: [long, lat] }
            //* Logic for getting image, saving file in folder and path in database
            //! Uncomment while implementing api call from frontend
            // let houseFrontImg = req.file
            // const ext = path.extname(houseFrontImg.originalname)
            // const imgName = Date.now() + ext
            // const imgType = "Houses"
            // const houseImgPath = await filePath(foundUC, foundAic, foundPolioTeam, foundPolioDay, imgType) + imgName
            // await fs.promises.writeFile(houseImgPath, houseFrontImg.buffer)
            // houseFrontImg = houseImgPath
            // console.log("Working: " + dhNo, polioHouseNo, residentName, residentContact, storeys, houseHolds, houseFrontImg, ext, imgName, imgType, houseImgPath, location)

            //* Creating house with information from body and image path
            //! add houseFrontImg when uncommenting above block
            const house = await House.create({ dhNo, polioHouseNo, residentName, residentContact, storeys, location })

            //* Creating Households based on the data provided and referencing to the house created above
            console.log("HouseHolds", houseHolds.length)
            if (houseHolds.length > 0) {
                for (const houseHold of houseHolds) {
                    const hHold = await HouseHold.create({})
                    if (houseHold.persons.length > 0) {
                        for (const person of houseHold.persons) {
                            console.log(person)
                            hHold.persons.push(person)
                            await hHold.save()
                        }
                    }
                    house.houseHolds.push(hHold._id)
                    await house.save()
                }
            }
            await house.save()
            foundPolioDay.houses.push(house._id)
            await foundPolioDay.save({})
            res.status(200).json("Create new House: Operation successful")

        } else {
            return next(new ErrorResponse("Create New House: Requested Operation Failed (You are not assigned as dengue team to this polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("Create new Street: Requested Operation Failed", 409))
    }
}