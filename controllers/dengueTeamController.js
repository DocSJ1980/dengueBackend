// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import DengueTeam from "../models/dengueTeamModel.js"
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import mongoose from "mongoose"


//FIRST ROUTE: Create indoor and outdoor dengueTeams based on the number of MSPs and FSPs assigned to the UC
export const dtCreate = async (req, res, next) => {
    //Getting the number of MSPs and FSPs and calculating the number of indoor and outdoor dengueTeams to create
    const uc = await UC.findById(req.fetchedUC._id).populate({ path: 'currentMembers', model: User })
    const totalStaff = uc.currentMembers
    const fsp = totalStaff.filter(staff => staff.gender === 'Female')
    const msp = totalStaff.filter(staff => staff.gender === 'Male')
    const indoorTeamNum = Math.floor(fsp.length / 2)
    const outdoorTeamNum = Math.floor(msp.length / 2)

    //Creating indoor dengueTeams based on the calculated numbers
    //Indoor and outdoor teams will be created only if there are already no created teams
    if (uc.indoorTeams.length === 0 && uc.outdoorTeams.length === 0) {
        try {
            let indoorIndex = 1
            let outdoorIndex = 1
            try {
                //Loop for creating indoor teams and logging their IDs in the UC
                while (indoorIndex <= indoorTeamNum) {
                    const teamType = "Indoor"
                    const teamNo = indoorIndex
                    const dt = await DengueTeam.create({ teamType, teamNo })
                    uc.indoorTeams.push(dt._id)
                    await uc.save()
                    indoorIndex++
                }
                //Loop for creating outdoor teams and logging their IDs in the UC
                while (outdoorIndex <= outdoorTeamNum) {
                    const teamType = "Outdoor"
                    const teamNo = outdoorIndex
                    const dt = await DengueTeam.create({ teamType, teamNo })
                    uc.outdoorTeams.push(dt._id)
                    await uc.save()
                    outdoorIndex++
                }
            } finally {
                //Returning the response after complete creation of dengue teams and insertion into UC 
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