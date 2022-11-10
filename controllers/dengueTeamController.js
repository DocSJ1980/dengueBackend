// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import DengueTeam from "../models/dengueTeamModel.js"
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import mongoose from "mongoose"


//FIRST ROUTE: Get all the simple activities

//SECOND ROUTE: Batch create Towns with CSV file
export const dtCreate = async (req, res, next) => {
    const loggedInUser = await User.findById(req.user._id)
    const uc = await UC.find({ 'supervisor': mongoose.Types.ObjectId(loggedInUser._id) })
    const ucID = uc[0]._id
    const foundUC = await UC.findById(ucID)
    const indoorTeamNum = Math.floor(req.body.fspNum / 2)
    const outdoorTeamNum = Math.floor(req.body.mspNum / 2)

    if (foundUC.indoorTeams.length === 0 && foundUC.outdoorTeams.length === 0) {
        try {
            let indoorIndex = 1
            let outdoorIndex = 1

            try {
                while (indoorIndex <= indoorTeamNum) {
                    const teamType = "Indoor"
                    const teamNo = indoorIndex
                    const dt = await DengueTeam.create({ teamType, teamNo })
                    foundUC.indoorTeams.push(dt._id)
                    await foundUC.save()
                    console.log(foundUC.indoorTeams)
                    indoorIndex++
                }
                while (outdoorIndex <= outdoorTeamNum) {
                    const teamType = "Outdoor"
                    const teamNo = outdoorIndex
                    const dt = await DengueTeam.create({ teamType, teamNo })
                    foundUC.outdoorTeams.push(dt._id)
                    await foundUC.save()
                    console.log(foundUC.outdoorTeams)
                    outdoorIndex++
                }
            } finally {
                return res.status(200).json(`${indoorIndex - 1} Indoor and ${outdoorIndex - 1} Outdoor Teams have been inserted`)
            }
        }
        catch (err) {
            return next(new ErrorResponse("Failed to both indoor and outdoor teams", 400))
        }
    } else {
        return next(new ErrorResponse(`${foundUC.indoorTeams.length} Indoor teams and ${foundUC.outdoorTeams.length} Outdoor teams are already present in UC`, 400))
    }
}