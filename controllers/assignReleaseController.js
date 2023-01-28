// Imports
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import UC from "../models/ucModel.js"
import DengueTeam from "../models/dengueTeamModel.js"
import { Aic, PolioDay, PolioTeam } from "../models/polioTeamModel.js"

//. 1st ROUTE: Set Supervisor Route to assign a supervisor to UC 
export const setSuper = async (req, res, next) => {
    const superv = await User.findById(req.body.superID)
    const uc = await UC.findById(req.body.UCID)
    const checkUC = await UC.findOne({ "supervisor.currentSuper": req.body.superID })
    const alreadySuper = await User.findById(uc.supervisor.currentSuper)

    try {
        //Checking if provided ID for the supervisor exists in our user database
        // console.log("try block reached")
        if (!superv) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        // Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        // Checking if provided ID for the supervisor is already the supervisor of the any UC
        else if (checkUC) {
            console.log("super check reached")
            return res.status(200).json({
                success: true,
                message: `${superv.name} is already supervisor of ${uc.survUC}`
            })
        }
        // Checking if provided ID for the supervisor is already the supervisor of the any UC
        else if (alreadySuper) {
            console.log("super check reached")
            return res.status(200).json({
                success: true,
                message: `${superv.name} is already supervisor of ${checkUC.survUC}`
            })
        }
        // Assigning the provided ID for the supervisor as supervisor of the provided UC in a condition when there is already assigned supervisor
        // Already assigned supervisor will be moved to the list of past Supervisors along with the date of change
        else if (!uc.supervisor.currentSuper) {
            console.log("Supervisor assign block reached")
            // const oldSuper1 = await User.findById(uc.supervisor.currentSuper._id)
            // const oldSuper = oldSuper1._id
            // uc.supervisor.pastSuper.push(oldSuper)
            uc.supervisor.currentSuper = superv._id
            await uc.save()
            res.status(200).json({
                success: true,
                message: `${superv.name} assigned as supervisor to ${uc.survUC}`
            })
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${superv.name} as supervisor of ${uc.survUC}`, 400))
    }
}

//. 2nd ROUTE: Remove Supervisor Route to remove a supervisor from UC 
export const removeSuper = async (req, res, next) => {
    const superv = await User.findById(req.body.superID)
    const checkUC = await UC.findOne({ "supervisor.currentSuper": req.body.superID })

    try {
        //* Checking if provided ID for the supervisor exists in our user database
        //* console.log("try block reached")
        if (!superv) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Removing the provided ID for the supervisor from supervisorship of the already assigned UC in he is already assigned supervisor
        //* Already assigned supervisor will be moved to the list of past Supervisors along with the date of change
        else if (checkUC) {
            // console.log("Supervisor assign block reached")
            const oldSuper = superv._id
            checkUC.supervisor.pastSuper.push(oldSuper)
            checkUC.supervisor.currentSuper = null
            await checkUC.save()
            res.status(200).json({
                success: true,
                message: `${superv.name} removed from supervisorship of ${checkUC.survUC}`
            })
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Operation failed`, 400))
    }
}

//. 3rd ROUTE: Assign staff to UC
export const assignStaff = async (req, res, next) => {
    try {
        //Simple self explanatory route to assign staff to UC
        //Only supervisors are able to assign staff to their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })

        //Check if user is already assigned to a dengueTeam or not. if yes then first remove from there
        const checkDT = await DengueTeam.findOne({ currentMembers: staff._id })
        const checkDTUC = await UC.findOne({ $or: [{ indoorTeams: checkDT._id }, { outdoorTeams: checkDT._id }] })

        //Checking if staff is already assigned as team member to a UC or working as supervisor of a UC
        const checkUC = await UC.findOne({ currentMembers: staff._id })
        const checkSuper = await UC.findOne({ "supervisor.currentSuper": staff._id })

        //Checking if staff is working in any dengue team
        if (checkDT) {
            return res.status(200).json(`${staff.name} cannot be removed as already working in ${checkDT.teamType} of ${checkDTUC.survUC}. Please remove from dengue team first`)
        }

        //Sending response if staff is already assigned as a team member to a UC
        else if (checkUC) {
            return res.status(200).json(`${staff.name} is already working as team member in ${checkUC.survUC}. Please remove to assign to ${foundUC.survUC}`)
        }

        //Sending response if staff is already assigned as a supervisor to a UC
        else if (checkSuper) {
            return res.status(200).json(`${staff.name} is already working as supervisor in ${checkSuper.survUC}. Please remove from supervisorship, to assign as team member to ${foundUC.survUC}`)
        }

        //Assigning staff to UC and saving it
        else {
            foundUC.currentMembers.push(staff._id)
            await foundUC.save()
            return res.status(200).json(`${staff.name} is assigned to ${foundUC.survUC} successfully`)
        }
    }
    catch (e) {
        return res.status(401).json("Caught an error")
    }
}

//. 4th: Remove staff from UC
export const removeStaff = async (req, res, next) => {
    try {
        //Simple self explanatory route to remove staff from UC
        //Only supervisors are able to remove staff from their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })
        // console.log(foundUC.survUC, staff.name)
        //Check if user is already assigned to a dengueTeam or not. if yes then first remove from there
        const checkDT = await DengueTeam.findOne({ currentMembers: staff._id })
        const checkDTUC = await UC.findOne({ $or: [{ indoorTeams: checkDT._id }, { outdoorTeams: checkDT._id }] })
        // console.log(checkDT)

        //function for removing staff from UC
        function removeItemOnce(arr, value) {
            var index = arr.indexOf(value);
            if (index > -1) {
                arr.splice(index, 1);
            }
            return arr;
        }

        //Checking if staff is working in any dengue team
        if (checkDT) {
            return res.status(200).json(`${staff.name} cannot be assigned to ${foundUC.survUC} as already working in ${checkDT.teamType} of ${checkDTUC.survUC}. Please remove from dengue team first`)
        }

        //Removing staff from currentMembers of UC, saving the UC and sending success response
        else if (foundUC.currentMembers.includes(staff._id)) {
            // console.log(foundUC.currentMembers)
            foundUC.currentMembers = removeItemOnce(foundUC.currentMembers, staff._id)
            // console.log(foundUC.currentMembers)
            await foundUC.save()
            return res.status(200).json(`${staff.name} is removed from ${foundUC.survUC} successfully`)
        } else {
            return res.status(401).json(`${staff.name} is not currently working in ${foundUC.survUC} as team member`)
        }
    }
    catch (e) {
        return res.status(401).json("Operation not successful")
    }
}

//. 5th ROUTE: Set Entomoligist Route to assign an entomologist to UC 
export const setEnto = async (req, res, next) => {
    const ento = await User.findById(req.body.entoID)
    const uc = await UC.findById(req.body.UCID)

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!ento) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        //* Checking if requested user is an entomologist or not
        else if (ento.desig != "Entomologist") {
            console.log(`${ento.name} is not entomologist and cannot be assigned as entomologist of UC: ${uc.survUC}. Please assign to an  appropriate staff.`)
            res.status(200).json({
                success: true,
                message: `Sorry ${ento.name} is not entomologist and cannot be assigned as entomologist of UC: ${uc.survUC}. Please assign to an  appropriate staff.`
            })
        }
        else if (ento.desig === "Entomologist") {
            //* Checking if an ento is already assigned or not
            if (uc.ento.currentEnto) {
                const alreadyEnto = await User.findById(uc.ento.currentEnto)
                console.log(`${alreadyEnto.name} is already Assigned as entomologist of UC: ${uc.survUC}. Please release`)
                res.status(200).json({
                    success: true,
                    message: `Sorry ${ento.name}cannot be assigned as entomologist of UC: ${uc.survUC}.  ${alreadyEnto.name} is already Assigned as entomologist, Please release`
                })
            }
            //* Assigning the provided ID for the entomolgist as entomologist of the provided UC
            else if (!uc.ento.currentEnto) {
                console.log("Entomologist assign block reached")
                uc.ento.currentEnto = ento._id
                await uc.save()
                res.status(200).json({
                    success: true,
                    message: `${ento.name} assigned as supervisor to ${uc.survUC}`
                })
            }
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${ento.name} as entomologist of ${uc.survUC}`, 400))
    }
}

//. 6th ROUTE: Remove Entomologist Route to remove Entomologist from UC 
export const removeEnto = async (req, res, next) => {
    const ento = await User.findById(req.body.entoID)
    const uc = await UC.findById(req.body.UCID)

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!ento) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        //* Checking if requested user is an entomologist or not
        else if (ento.desig != "Entomologist") {
            console.log(`${ento.name} is not entomologist.`)
            res.status(200).json({
                success: true,
                message: `Sorry ${ento.name} is not entomologist `
            })
        }
        else if (ento.desig === "Entomologist") {
            //* Checking if an ento is already assigned or not
            //* Assigning the provided ID for the entomolgist as entomologist of the provided UC
            if (!uc.ento.currentEnto) {
                console.log("No Entomologist assigned")
                res.status(200).json({
                    success: true,
                    message: `Sorry! No entomologist is already assigned as entomologist to ${uc.survUC}`
                })
            }
            else if (uc.ento.currentEnto) {
                const alreadyEnto = await User.findById(uc.ento.currentEnto)
                const oldEnto = alreadyEnto._id
                uc.ento.currentEnto = null
                uc.ento.pastEntos.push(oldEnto)
                await uc.save()
                console.log(`${alreadyEnto.name} is removed from entomologist of UC: ${uc.survUC} and added to the list of past entomologists.`)
                res.status(200).json({
                    success: true,
                    message: `${alreadyEnto.name} is removed from entomologist of UC: ${uc.survUC} and added to the list of past entomologists.`
                })
            }
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to remove ${ento.name} from entomologist of ${uc.survUC}`, 400))
    }
}

//. 7th ROUTE: Set Town Entomoligist Route to assign Town entomologist to Town 
export const setTownEnto = async (req, res, next) => {
    const townEnto = await User.findById(req.body.entoID)
    const ucs = await UC.find({ town: req.body.townID })

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!townEnto) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!ucs) {
            return res.status(404).json({
                success: false,
                message: "Town not found",
            })
        }

        //* Checking if requested user is an entomologist or not
        if (townEnto.desig === "Entomologist") {
            let breakCheck = false
            for (const uc of ucs) {
                //* Checking if requested user is an entomologist or not
                if (!uc.townEnto.currentTownEnto) {
                    uc.townEnto.currentTownEnto = townEnto._id
                    console.log(uc.townEnto.currentTownEnto)
                    await uc.save()
                    console.log(`${townEnto.name} successfully assigned as town Entomologist for the UC: ${uc.survUC}`)
                } else if (uc.townEnto.currentTownEnto) {
                    res.status(200).json({
                        success: true,
                        message: `Sorry! Cannot assign ${townEnto.name} as Town Entomologist for requested town, as ${uc.survUC} already has a town entomologist assigned. Please release the town entomologist`
                    })
                    breakCheck = true
                    break;
                }
            }
            if (!breakCheck) {
                res.status(200).json({
                    success: true,
                    message: `Successfully assigned ${townEnto.name} as Town Entomologist for requested town`
                })
            }
        } else if (townEnto.desig != "Entomologist") {
            res.status(200).json({
                success: true,
                message: `Sorry! ${townEnto.name} is not an entomologist. Please assign an entomologist as Town Entomologist for the requested town`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${townEnto.name} as Town entomologist of requested Town`, 400))
    }
}

//. 8th ROUTE: Remove Town Entomologist Route to remove Townn Entomologist from a Town 
export const removeTownEnto = async (req, res, next) => {
    const townEnto = await User.findById(req.body.entoID)
    const ucs = await UC.find({ "townEnto.currentTownEnto": req.body.entoID })

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!townEnto) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the entomolgist is assigned as town entomologist
        else if (ucs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Requested User is not town entomologist in any town",
            })
        }

        //* Checking if requested user is an entomologist or not
        if (townEnto.desig === "Entomologist" && ucs.length > 0) {
            for (const uc of ucs) {
                //* Checking if requested user is an entomologist or not
                console.log(uc.survUC, !uc.townEnto.currentTownEnto)

                if (uc.townEnto.currentTownEnto) {
                    uc.townEnto.currentTownEnto = null
                    const oldTownEnto = townEnto._id
                    uc.townEnto.pastTownEntos.push(oldTownEnto)
                    await uc.save()
                    console.log(`${townEnto.name} successfully removed from town Entomologist for the UC: ${uc.survUC}`)
                }
            }
            //* Returning response after successful loop
            res.status(200).json({
                success: true,
                message: `Successfully removed ${townEnto.name} from Town Entomologist for requested town and added to the list of past town entomologists`
            })
        }
        //* In case the provided ID is not of an entomologist
        else if (townEnto.desig != "Entomologist") {
            res.status(200).json({
                success: true,
                message: `Sorry! ${townEnto.name} is not an entomologist. Please assign an entomologist as Town Entomologist for the requested town`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Operation Failed: Town Entomologist release`, 400))
    }
}

//. 9th ROUTE: Set DDHO Route to assign DDHO to Town 
export const setDdho = async (req, res, next) => {
    const ddho = await User.findById(req.body.ddhoID)
    const ucs = await UC.find({ town: req.body.townID })

    try {
        //* Checking if provided ID for the DDHO exists in our user database
        // console.log("try block reached")
        if (!ddho) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the town exists in our town database
        else if (!ucs) {
            return res.status(404).json({
                success: false,
                message: "Town not found",
            })
        }

        //* Checking if requested user is DDHO or not
        if (ddho.desig === "DDHO") {
            let breakCheck = false
            for (const uc of ucs) {
                //* Checking if requested DDHO is assigned to the UCs of the town or not and if not then assigning provided DDHO to the UCs
                if (!uc.ddho.currentDdho) {
                    uc.ddho.currentDdho = ddho._id
                    console.log(uc.ddho.currentDdho)
                    await uc.save()
                    console.log(`${ddho.name} successfully assigned as DDHO for the UC: ${uc.survUC}`)
                } else if (uc.ddho.currentDdho) {
                    res.status(200).json({
                        success: true,
                        message: `Sorry! Cannot assign ${ddho.name} as DDHO for requested town, as ${uc.survUC} already has a DDDHO assigned. Please release the DDHO`
                    })
                    breakCheck = true
                    break;
                }
            }
            if (!breakCheck) {
                res.status(200).json({
                    success: true,
                    message: `Successfully assigned ${ddho.name} as DDHO for requested town`
                })
            }
        } else if (ddho.desig != "DDHO") {
            res.status(200).json({
                success: true,
                message: `Sorry! ${ddho.name} is not DDHO. Please assign a DDHO as DDHO for the requested town`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${ddho.name} as DDHO of requested Town`, 400))
    }
}

//. 10th ROUTE: Remove DDHO Route to remove DDHO from a Town 
export const removeDdho = async (req, res, next) => {
    const ddho = await User.findById(req.body.ddhoID)
    const ucs = await UC.find({ "ddho.currentDdho": req.body.ddhoID })

    try {
        //* Checking if provided ID for the DDHO exists in our user database
        // console.log("try block reached")
        if (!ddho) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the DDHO is assigned as DDHO
        else if (ucs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Requested User is not DDHO in any town",
            })
        }

        //* Checking if requested user is an DDHO or not
        if (ddho.desig === "DDHO" && ucs.length > 0) {
            for (const uc of ucs) {
                //* Checking if requested user is an DDHO or not
                console.log(uc.survUC, !uc.ddho.currentDdho)

                if (uc.ddho.currentDdho) {
                    uc.ddho.currentDdho = null
                    const oldDdho = ddho._id
                    uc.ddho.pastDdhos.push(oldDdho)
                    await uc.save()
                    console.log(`${ddho.name} successfully removed from DDHO for the UC: ${uc.survUC}`)
                }
            }
            //* Returning response after successful loop
            res.status(200).json({
                success: true,
                message: `Successfully removed ${ddho.name} from DDHO for requested town and added to the list of past town entomologists`
            })
        }
        //* In case the provided ID is not of an entomologist
        else if (ddho.desig != "Entomologist") {
            res.status(200).json({
                success: true,
                message: `Sorry! ${ddho.name} is not an entomologist. Please assign an entomologist as Town Entomologist for the requested town`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Operation Failed: Town Entomologist release`, 400))
    }
}

//. 11th ROUTE: Set Aic Route to assign Aic to PolioDay 
export const assignAic = async (req, res, next) => {
    const areaIncharge = await User.findById(req.body.areaInchareID)
    const aic = await Aic.findById(req.body.aicID)
    const checkAicUC = await UC.findOne({ "polioSubUCs.aic": aic._id })
    console.log(areaIncharge.name, aic.areaIncharge.currentAic, req.fetchedUC.survUC, checkAicUC.survUC)
    try {
        //* Checking if provided ID for the Area Incharge exists in our database
        // console.log("try block reached")
        if (!areaIncharge) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the area exists in our database
        else if (!aic) {
            return res.status(404).json({
                success: false,
                message: "Polio area not found",
            })
        }

        //* Checking if supervisor's UC and requested area UC match
        if (checkAicUC._id.equals(req.fetchedUC._id)) {
            //* Checking if an area Incharge is already assigned
            if (!aic.areaIncharge.currentAic) {
                aic.areaIncharge.currentAic = areaIncharge._id
                await aic.save()
                res.status(200).json({
                    success: true,
                    message: `${areaIncharge.name} successfully assigned as current area incharge for ${checkAicUC.survUC}`
                })
            }
            //* Checking if an area Incharge is not already assigned
            else if (aic.areaIncharge.currentAic) {
                console.log("Block 2 reached")
                const checkAreaIncharge = await User.findById(aic.areaIncharge.currentAic)
                console.log(checkAreaIncharge)
                res.status(200).json({
                    success: true,
                    message: `Sorry! ${areaIncharge.name} is cannot be assgned as area incharge as ${checkAreaIncharge.name} is already working as areaIncharge. Please release!`
                })
            }
        }
        //* Returning response if supervisor's UC and requested area UC doe's not match
        else if (!checkAicUC._id.equals(req.fetchedUC._id)) {
            res.status(200).json({
                success: true,
                message: `UC Mismatch. Please contact District Dengue Cell.`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${areaIncharge.name} as area incharge of requested area`, 400))
    }
}

//. 12th ROUTE: Remove Aic Route to remove Area incharge from a PolioDay 
export const removeAic = async (req, res, next) => {
    const areaIncharge = await User.findById(req.body.areaInchareID)
    const area = await Aic.findById(req.body.aicID)
    const checkAreaUC = await UC.findOne({ "polioSubUCs.aic": area._id })
    console.log(areaIncharge.name, area.aicNumber, req.fetchedUC.survUC, checkAreaUC.survUC)
    try {
        //* Checking if provided ID for the Area Incharge exists in our database
        // console.log("try block reached")
        if (!areaIncharge) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the area exists in our database
        else if (!area) {
            return res.status(404).json({
                success: false,
                message: "Polio area not found",
            })
        }

        //* Checking if supervisor's UC and requested area UC match
        if (checkAreaUC.survUC === req.fetchedUC.survUC) {
            console.log("1st if reached")
            console.log(area)
            //* Checking if an area Incharge is already assigned
            if (area.areaIncharge.currentAic) {
                console.log("2nd if reached")
                const checkAreaIncharge = await User.findById(area.areaIncharge.currentAic)
                if (checkAreaIncharge._id.equals(areaIncharge._id)) {
                    console.log("3rd if reached")
                    area.areaIncharge.currentAic = null
                    const oldAic = areaIncharge._id
                    area.areaIncharge.pastAics.push(oldAic)
                    await area.save()
                    res.status(200).json({
                        success: true,
                        message: `${areaIncharge.name} successfully removed from current area incharge for requested area`
                    })
                } else if (!checkAreaIncharge._id.equals(areaIncharge._id)) {
                    console.log("3rd else reached")
                    res.status(200).json({
                        success: true,
                        message: `Request area Incharge and assigned area incharge do not match`
                    })
                }
            } else if (!area.areaIncharge.currentAic) {
                console.log("2nd else reached")
                res.status(200).json({
                    success: true,
                    message: `No area incharge currently assigned for requested area`
                })

            }

        }
        //* Returning response if supervisor's UC and requested area UC doe's not match
        else if (!checkAreaUC._id.equals(req.fetchedUC._id).equals(reqAicUC._id)) {
            console.log("1st else reached")
            res.status(200).json({
                success: true,
                message: `UC Mismatch. Please contact District Dengue Cell.`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Failed to remove ${areaIncharge.name} from area incharge of requested area`, 400))
    }
}