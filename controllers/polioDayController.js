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
    const polioDays = req.polioDay
    const checked = polioDays.filter(checkIDMatch)

    function checkIDMatch(polioDays) {
        console.log("Received")
        if (polioDays._id.equals(foundPolioDay._id)) {
            console.log("Polio Day found")
            return true
        } else {
            console.log("Polio Day Not found")
        }
        return false
    }
    try {
        //* Authenticating if the reporting team is assigned to the polio day or not
        //* Authenticity of the team already checked in isTeam middleware in routes
        if (checked) {
            //* Getting information from the body
            const dhNo = req.body.dhNo
            const polioHouseNo = req.body.polioHouseNo
            const storeys = req.body.storeys
            const houseHolds = req.body.houseHolds
            const long = req.body.long
            const lat = req.body.lat
            const location = { type: "Point", coordinates: [long, lat] }
            const createdBy = req.user._id
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
            const house = await House.create({ dhNo, polioHouseNo, storeys, location, createdBy })

            //* Creating Households based on the data provided and referencing to the house created above
            console.log("HouseHolds", houseHolds.length)
            if (houseHolds.length > 0) {
                for (const houseHold of houseHolds) {
                    const residentName = houseHold.residentName
                    const residentContact = houseHold.residentContact
                    const residentType = houseHold.residentType
                    const hHold = await HouseHold.create({ residentName, residentContact, residentType, createdBy })
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
        return next(new ErrorResponse("Create new House: Requested Operation Failed", 409))
    }
}

//. 3rd Route: Uptade House
export const updateHouse = async (req, res, next) => {
    const { foundPolioDay, foundHouse } = await getData(req.body.houseID)
    const polioDays = req.polioDay
    const checked = polioDays.filter(checkIDMatch)

    function checkIDMatch(polioDays) {
        console.log("Received")
        if (polioDays._id.equals(foundPolioDay._id)) {
            console.log("Polio Day found")
            return true
        } else {
            console.log("Polio Day Not found")
        }
        return false
    }
    try {
        //* Authenticating if the reporting team is assigned to the polio day or not
        //* Authenticity of the team already checked in isTeam middleware in routes
        if (checked) {
            //* Updating details based on the request
            const dhNo = req.body.dhNo
            if (dhNo) {
                foundHouse.dhNo = dhNo
                await foundHouse.save()
            }
            const polioHouseNo = req.body.polioHouseNo
            if (polioHouseNo) {
                foundHouse.polioHouseNo = polioHouseNo
                await foundHouse.save()
            }
            const storeys = req.body.storeys
            if (storeys) {
                foundHouse.storeys = storeys
                await foundHouse.save()
            }

            //* Will not update location, image or createdBy. Use delete for that purpose


            res.status(200).json("House Update: Operation successful")

        } else {
            return next(new ErrorResponse("House Update: Requested Operation Failed (You are not assigned as dengue team to this polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("House Update: Requested Operation Failed", 409))
    }
}

//. 4th Route: Uptade HouseHold
export const updateHouseHold = async (req, res, next) => {
    const { foundPolioDay, foundHouseHold } = await getData(req.body.houseHoldID)
    const polioDays = req.polioDay
    const checked = polioDays.filter(checkIDMatch)

    function checkIDMatch(polioDays) {
        console.log("Received")
        if (polioDays._id.equals(foundPolioDay._id)) {
            console.log("Polio Day found")
            return true
        } else {
            console.log("Polio Day Not found")
        }
        return false
    }
    try {
        //* Authenticating if the reporting team is assigned to the polio day or not
        //* Authenticity of the team already checked in isTeam middleware in routes
        //* Updating Households based on the data provided and referencing to the house created above
        if (checked) {
            const residentName = req.body.residentName
            if (residentName) {
                foundHouseHold.residentName = residentName
                await foundHouseHold.save()
            }
            const residentContact = req.body.residentContact
            if (residentContact) {
                foundHouseHold.residentContact = residentContact
                await foundHouseHold.save()
            }
            const residentType = req.body.residentType
            if (residentType) {
                foundHouseHold.residentType = residentType
                await foundHouseHold.save()
            }
            console.log("Reached", req.body.persons)
            if (req.body.persons) {
                if (req.body.persons.length > 0) {
                    foundHouseHold.persons = []
                    for (const person of req.body.persons) {
                        console.log(person)
                        foundHouseHold.persons.push(person)
                    }
                    await foundHouseHold.save()
                }
            }
            res.status(200).json("Household Update: Operation successful")

        } else {
            return next(new ErrorResponse("Household Update: Requested Operation Failed (You are not assigned as dengue team to this polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("Household Update: Requested Operation Failed", 409))
    }
}

//. 5th Route: Delete HouseHold
export const deleteHouse = async (req, res, next) => {
    const { foundPolioDay, foundHouse } = await getData(req.body.houseID)
    const polioDays = req.polioDay
    const checked = polioDays.filter(checkIDMatch)

    function checkIDMatch(polioDays) {
        console.log("Received")
        if (polioDays._id.equals(foundPolioDay._id)) {
            console.log("Polio Day found")
            return true
        } else {
            console.log("Polio Day Not found")
        }
        return false
    }
    try {
        //* Authenticating if the reporting team is assigned to the polio day or not
        //* Authenticity of the team already checked in isTeam middleware in routes
        if (checked) {
            //TODO: Delete Image from storage functionality needs to be implemented
            if (foundHouse.houseHolds.length > 0) {
                return next(new ErrorResponse("House Delete: Requested Operation Failed (HouseHolds Present, you need to delete those first ).", 401))
            }
            await House.findByIdAndDelete(req.body.houseID)
            res.status(200).json("House Delete: Operation successful")

        } else {
            return next(new ErrorResponse("House Delete: Requested Operation Failed (You are not assigned as dengue team to this polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("House Delete: Requested Operation Failed", 409))
    }
}

//. 6th Route: Delete HouseHold
export const deleteHouseHold = async (req, res, next) => {
    const { foundPolioDay, foundHouse, foundHouseHold } = await getData(req.body.houseHoldID)
    const polioDays = req.polioDay
    const checked = polioDays.filter(checkIDMatch)

    function checkIDMatch(polioDays) {
        console.log("Received")
        if (polioDays._id.equals(foundPolioDay._id)) {
            console.log("Polio Day found")
            return true
        } else {
            console.log("Polio Day Not found")
        }
        return false
    }
    try {
        //* Authenticating if the reporting team is assigned to the polio day or not
        //* Authenticity of the team already checked in isTeam middleware in routes
        //* Updating Households based on the data provided and referencing to the house created above
        if (checked) {
            console.log(foundHouse)
            foundHouse.houseHolds = removeItemOnce(foundHouse.houseHolds, req.body.houseHoldID)
            await foundHouse.save()
            await HouseHold.findByIdAndDelete(req.body.houseHoldID)
            res.status(200).json("Household Delete: Operation successful")

        } else {
            return next(new ErrorResponse("Household Delete: Requested Operation Failed (You are not assigned as dengue team to this polio day).", 401))
        }
    } catch (error) {
        return next(new ErrorResponse("Household Delete: Requested Operation Failed", 409))
    }
}

//*function for removing value from array
function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}