// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import DengueTeam from "../models/dengueTeamModel.js"
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"

//FIRST ROUTE: Get all the simple activities

//SECOND ROUTE: Batch create Towns with CSV file
export const createTeams = async (req, res, next) => {
    const loggedInUser = await User.findById(req.user._id)
    const uc = UC.find({ 'UC.supervisor': loggedInUser })
    try {
        const indoorTeamNum = Math.floor(req.body.fspNum / 2)
        const outdoorTeamNum = Math.floor(req.body.mspNum / 2)
        let indoorIndex = 1
        let outdoorIndex = 1
        try {
            while (indoorIndex <= indoorTeamNum) {
                const teamType = "Indoor"
                await DengueTeam.create({ teamType })
                indoorIndex++
            }
            while (outdoorIndex <= outdoorTeamNum) {
                console.log("outdoor loop reached")
                const teamType = "Outdoor"
                await DengueTeam.create({ teamType })
                outdoorIndex++
            }
        } finally {
            return res.status(200).json(`${indoorIndex - 1} Indoor and ${outdoorIndex - 1} Outdoor Teams have been inserted`)
        }
    }
    catch (err) {
        return next(new ErrorResponse("Failed to both indoor and outdoor teams", 400))
    }
}