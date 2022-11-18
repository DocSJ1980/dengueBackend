// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import DengueTeam from "../models/dengueTeamModel.js"
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import mongoose from "mongoose"
import { Aic, PolioDay, PolioTeam } from "../models/polioTeamModel.js"


//. 1st ROUTE: Create indoor and outdoor dengueTeams based on the number of MSPs and FSPs assigned to the UC
export const dtCreate = async (req, res, next) => {
    //* Getting the number of MSPs and FSPs and calculating the number of indoor and outdoor dengueTeams to create
    const uc = await UC.findById(req.fetchedUC._id).populate({ path: 'currentMembers', model: User })
    const totalStaff = uc.currentMembers
    const fsp = totalStaff.filter(staff => staff.gender === 'Female')
    const msp = totalStaff.filter(staff => staff.gender === 'Male')
    const indoorTeamNum = Math.floor(fsp.length / 2)
    const outdoorTeamNum = Math.floor(msp.length / 2)

    //* Creating indoor dengueTeams based on the calculated numbers
    //* Indoor and outdoor teams will be created only if there are already no created teams
    if (uc.indoorTeams.length === 0 && uc.outdoorTeams.length === 0) {
        try {
            let indoorIndex = 1
            let outdoorIndex = 1
            try {
                //* Loop for creating indoor teams and logging their IDs in the UC
                while (indoorIndex <= indoorTeamNum) {
                    const teamType = "Indoor"
                    const teamNo = indoorIndex
                    const dt = await DengueTeam.create({ teamType, teamNo })
                    uc.indoorTeams.push(dt._id)
                    await uc.save()
                    indoorIndex++
                }
                //* Loop for creating outdoor teams and logging their IDs in the UC
                while (outdoorIndex <= outdoorTeamNum) {
                    const teamType = "Outdoor"
                    const teamNo = outdoorIndex
                    const dt = await DengueTeam.create({ teamType, teamNo })
                    uc.outdoorTeams.push(dt._id)
                    await uc.save()
                    outdoorIndex++
                }
            } finally {
                //* Returning the response after complete creation of dengue teams and insertion into UC 
                return res.status(200).json(`${indoorIndex - 1} Indoor and ${outdoorIndex - 1} Outdoor Teams have been inserted`)
            }
        }
        catch (err) {
            return next(new ErrorResponse("Failed to both indoor and outdoor teams", 400))
        }
    } else {
        return next(new ErrorResponse(`${uc.indoorTeams.length} Indoor teams and ${uc.outdoorTeams.length} Outdoor teams are already present in UC`, 400))
    }
}

//. 2nd ROUTE: Assign staff to dengueTeam
export const assignStaffDT = async (req, res, next) => {
    try {
        // console.log('Request received')
        //* Simple self explanatory route to assign staff to dengue team in UC
        //*Only supervisors are able to assign staff to their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        // console.log(staff.name)
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })
        // console.log(foundUC.survUC)
        const dengueTeam = await DengueTeam.findById(req.body.dtID)
        // console.log(dengueTeam.teamType)
        const checkUC = await UC.findOne({ currentMembers: staff._id })
        // console.log(checkUC.survUC)
        const checkDT = await DengueTeam.findOne({ currentMembers: staff._id })
        // console.log(checkDT)

        //*Checking if staff is working in any dengue team
        if (checkDT) {
            // console.log('Check assigned to dengueTeam block reached')
            const checkDTUC = await UC.findOne({ $or: [{ indoorTeams: checkDT._id }, { outdoorTeams: checkDT._id }] })
            // console.log(checkDTUC.survUC)
            return res.status(200).json(`${staff.name} cannot be assigned to ${dengueTeam.teamType} Dengue team in ${foundUC.survUC} as already working in ${checkDT.teamType} of ${checkDTUC.survUC}`)
        }

        //*Checing if staff belongs to requesting supervisor's UC
        else if (checkUC._id.equals(foundUC._id)) {
            // console.log('Verification block for supervisors UC and staff UC reached')

            //*Checking male members are being assigned to outdoor and female staff members are being assigned to indoor teams
            if (staff.gender === 'Male' && dengueTeam.teamType === 'Indoor') {
                // console.log('Male : Indoor block reached');
                return res.status(200).json(`${staff.name} is Male and cannot be assigned to Indoor team`)
            } else if (staff.gender === 'Female' && dengueTeam.teamType === 'Outdoor') {
                // console.log('Female : Outdoor block reached');
                return res.status(200).json(`${staff.name} is Female and cannot be assigned to Outdoor team`)
            }

            //*Checking if there is space available in the dengueTeam
            else if (dengueTeam.currentMembers.length >= 2) {
                // console.log('Number of teamMembers check block reached');
                return res.status(200).json(`${staff.name} cannot be assigned to ${dengueTeam.teamType} Dengue team in ${foundUC.survUC} as already two members are assigned`)
            }

            //*Finally adding staff to dengueTeam
            else if (dengueTeam.currentMembers.length < 2) {
                // console.log('Final block for assigning staff to dengueTeam reached');
                dengueTeam.currentMembers.push(staff._id)
                await dengueTeam.save()
                return res.status(200).json(`${staff.name} is successfully assigned to ${dengueTeam.teamType} Dengue team in ${foundUC.survUC}`)
            }
        }
    }
    catch (e) {
        return res.status(401).json("Caught an error")
    }
}

//. 3rd ROUTE: Remove staff to dengueTeam
export const removeStaffDT = async (req, res, next) => {
    try {
        //* Simple self explanatory route to assign staff to dengue team in UC
        //* Only supervisors are able to assign staff to their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })
        const dengueTeam = await DengueTeam.findById(req.body.dtID)
        const checkUC = await UC.findOne({ currentMembers: staff._id })
        const checkDT = await DengueTeam.findOne({ currentMembers: staff._id })
        // console.log(checkDT.teamType)


        //* Checking if staff is working in any dengue team
        if (!checkUC._id.equals(foundUC._id)) {
            // console.log('Staff is not working in the requested dengue team');
            const checkDTUC = await UC.findOne({ $or: [{ indoorTeams: checkDT._id }, { outdoorTeams: checkDT._id }] })
            return res.status(200).json(`${staff.name} cannot be removed from ${dengueTeam.teamType} Dengue team in ${foundUC.survUC} as already working in ${checkDT.teamType} dengue team of ${checkDTUC.survUC}`)
        }
        //* Checing if staff belongs to requesting supervisor's UC
        else if (checkUC._id.equals(foundUC._id) && dengueTeam._id.equals(checkDT._id)) {
            // console.log('Final block for removing staff from dengueTeam reached');
            const oldMember = staff._id
            dengueTeam.pastMembers.push(oldMember)
            dengueTeam.currentMembers = removeItemOnce(dengueTeam.currentMembers, staff._id)
            await dengueTeam.save()
            return res.status(200).json(`${staff.name} is successfully removed from ${dengueTeam.teamType} Dengue team in ${foundUC.survUC}`)
        }
    }
    catch (e) {
        return res.status(401).json("Caught an error")
    }
}

//. 4th ROUTE: Assign polioDay to dengueTeam
export const assignPolioDay = async (req, res, next) => {
    try {
        console.log('Request received')
        //* Simple self explanatory route to assign staff to dengue team in UC
        //*Only supervisors are able to assign staff to their UCs
        const polioDay = await PolioDay.findOne({ _id: req.body.polioDayID })
        // console.log(polioDay.dayNo)
        const dengueTeam = await DengueTeam.findById(req.body.dtID)
        // console.log(dengueTeam.teamType)
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })
        // console.log(foundUC.survUC)
        const polioTeam = await PolioTeam.findOne({ $in: { polioDays: polioDay._id } })
        // console.log(polioTeam.teamType)
        const checkAic = await Aic.findOne({ "polioTeams.mobilePolioTeams": polioTeam._id })
        // console.log(checkAic.aicNumber)
        const checkUC = await UC.findOne({ "polioSubUCs.aic": checkAic._id })
        // console.log(checkUC.survUC)
        const checkPolioDayIndoor = await PolioDay.findOne({ "assignedDengueTeam.currentIndoorDT": req.body.dtID })
        // console.log(checkPolioDayIndoor.dayNo)
        const checkPolioDayOutdoor = await PolioDay.findOne({ "assignedDengueTeam.currentOutdoorDT": req.body.dtID })
        // console.log(checkPolioDayOutdoor.dayNo)

        //* Checing if UC of polio Day is assigned to any dengue team
        if (checkUC._id.equals(foundUC._id)
            && polioDay.assignedDengueTeam.currentIndoorDT
            && dengueTeam.teamType === "Indoor") {
            console.log('Check for assigned indoor dengueTeam block reached')
            return res.status(200).json(`Polio Day-${polioDay.dayNo} of Polio Team-${polioTeam.teamNo} is already assigned to another Indoor dengue team. Please remove`)
        }
        else if (checkUC._id.equals(foundUC._id)
            && polioDay.assignedDengueTeam.currentOutdoorDT
            && dengueTeam.teamType === "Outdoor") {
            console.log('Check for assigned Outdoor dengueTeam block reached')
            return res.status(200).json(`Polio Day-${polioDay.dayNo} of Polio Team-${polioTeam.teamNo} is already assigned to another Outdoor dengue team. Please remove`)
        }

        //* Checing if UC of requested polio Day is same as that of assigning supervisor
        else if (checkUC._id.equals(foundUC._id)
            && !polioDay.assignedDengueTeam.currentIndoorDT
            && !checkPolioDayIndoor
            && dengueTeam.teamType === "Indoor") {
            console.log('Final assignment indoor dengueTeam to polioDay reached')
            polioDay.assignedDengueTeam.currentIndoorDT = dengueTeam._id
            await polioDay.save()
            return res.status(200).json(`Polio Day-${polioDay.dayNo} of Polio Team-${polioTeam.teamNo} is successfully assigned to ${dengueTeam.teamType} Dengue team-${dengueTeam.teamNo} in ${foundUC.survUC}`)
        }
        else if (checkUC._id.equals(foundUC._id)
            && !polioDay.assignedDengueTeam.currentOutdoorDT
            && !checkPolioDayOutdoor
            && dengueTeam.teamType === "Outdoor") {
            console.log('Final assignment outdoor dengueTeam to polioDay reached')
            polioDay.assignedDengueTeam.currentOutdoorDT = dengueTeam._id
            await polioDay.save()
            return res.status(200).json(`Polio Day-${polioDay.dayNo} of Polio Team-${polioTeam.teamNo} is successfully assigned to ${dengueTeam.teamType} Dengue team-${dengueTeam.teamNo} in ${foundUC.survUC}`)
        }
    }
    catch (e) {
        return res.status(401).json("Caught an error")
    }
}

//. 4th ROUTE: Assign polioDay to dengueTeam
export const releasePolioDay = async (req, res, next) => {
    try {
        console.log('Request received')
        //* Simple self explanatory route to assign staff to dengue team in UC
        //*Only supervisors are able to assign staff to their UCs
        const polioDay = await PolioDay.findOne({ _id: req.body.polioDayID })
        console.log(polioDay.dayNo)
        const dengueTeam = await DengueTeam.findById(req.body.dtID)
        console.log(dengueTeam.teamType)
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })
        console.log(foundUC._id)
        const polioTeam = await PolioTeam.findOne({ $in: { polioDays: polioDay._id } })
        console.log(polioTeam.teamType)
        const checkAic = await Aic.findOne({ "polioTeams.mobilePolioTeams": polioTeam._id })
        console.log(checkAic.aicNumber)
        const checkUC = await UC.findOne({ "polioSubUCs.aic": checkAic._id })
        console.log(checkUC._id)
        console.log(checkUC._id.equals(foundUC._id))

        //* Checing if UC of requested polio Day is same as that of assigning supervisor
        //* Checing if correct teamtype is being updated
        //* Checing if assgned dengueTeam is correct for the polioDay
        if (checkUC._id.equals(foundUC._id)) {
            //* Logic for indoor team
            if (dengueTeam.teamType === "Indoor") {
                if (polioDay.assignedDengueTeam.currentIndoorDT.equals(dengueTeam._id)) {
                    console.log('Final removal indoor dengueTeam to polioDay reached')
                    const oldIndoorDTs = dengueTeam._id
                    polioDay.assignedDengueTeam.currentIndoorDT = null
                    polioDay.assignedDengueTeam.pastIndoorDTs.push(oldIndoorDTs)
                    await polioDay.save()
                    return res.status(200).json(`Polio Day-${polioDay.dayNo} of Polio Team-${polioTeam.teamNo} is successfully removed from ${dengueTeam.teamType} Dengue team-${dengueTeam.teamNo} in ${foundUC.survUC}`)

                }
            }
            //* Logic for outdoor team
            else if (dengueTeam.teamType === "Outdoor") {
                if (polioDay.assignedDengueTeam.currentOutdoorDT.equals(dengueTeam._id)) {
                    console.log('Final removal outdoor dengueTeam to polioDay reached')
                    const oldOutdoorDTs = dengueTeam._id
                    polioDay.assignedDengueTeam.currentOutdoorDT = null
                    polioDay.assignedDengueTeam.pastOutdoorDTs.push(oldOutdoorDTs)
                    await polioDay.save()
                    return res.status(200).json(`Polio Day-${polioDay.dayNo} of Polio Team-${polioTeam.teamNo} is successfully removed from ${dengueTeam.teamType} Dengue team-${dengueTeam.teamNo} in ${foundUC.survUC}`)
                }
            }
        }
    }
    catch (e) {
        return res.status(401).json("Dengue Team release operation failed")
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