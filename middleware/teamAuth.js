import jwt from "jsonwebtoken";
import DengueTeam from "../models/dengueTeamModel.js";
import { PolioDay } from "../models/polioTeamModel.js";
import UC from "../models/ucModel.js";
import User from "../models/userModel.js";
import ErrorResponse from "../utils/Error.js";

export const isTeam = async (req, res, next) => {
    console.log("Team Authentication: Request received.")
    try {
        console.log("Team Auth try block reached")
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json(
                {
                    success: false,
                    message: "Login First"
                }
            );
        }
        let notFound
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded._id);
        req.fetchedUC = await UC.findOne({ currentMembers: req.user._id })
        req.dengueTeam = await DengueTeam.findOne({ currentMembers: req.user._id })
        console.log(req.dengueTeam.teamType)
        if (req.dengueTeam.teamType === 'Indoor') {
            req.polioDay = await PolioDay.findOne({
                "assignedDengueTeam.currentIndoorDT": req.dengueTeam._id
            })
        } else {
            req.polioDay = await PolioDay.findOne({ "assignedDengueTeam.currentOutdoorDT": req.dengueTeam._id })
        }

        if (req.user, req.fetchedUC && req.dengueTeam && req.polioDay) {
            console.log("Team authenticated")
            next()
        } else {
            if (!req.fetchedUC) {
                notFound = "UC"
            } else if (!req.dengueTeam) {
                notFound = "Dengue Team"
            }
            else if (!req.polioDay) {
                notFound = "Polio Day"
            }

            return next(new ErrorResponse(`Un-Authorized Operation. Your Identity as team member could not be verified as ${notFound} was not found to be assigned to you`), 401)

        }
    } catch (error) {
        return next(new ErrorResponse(`Team Authentication: Operation Failed`), 409)
    }
};