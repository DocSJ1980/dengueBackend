import jwt from "jsonwebtoken";
import { Aic, PolioDay } from "../models/polioTeamModel.js";
import UC from "../models/ucModel.js";
import User from "../models/userModel.js";

export const isAic = async (req, res, next) => {

    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const accessToken = authHeader.split(' ')[1]
    jwt.verify(
        accessToken,
        process.env.JWT_SECRET,
        async (err, decoded) => {

            if (err) return res.status(403).json({ success: false, message: 'Forbidden' })
            req.aic = await Aic.findOne({ "areaIncharge.currentAic": decoded._id })
            req.fetchedUC = await UC.findOne({ "polioSubUCs.aic": req.aic._id })
            req.user = await User.findById(decoded._id);

            if (req.aic && req.user) {
                next()
            } else {
                return res.status(401).json({ success: false, message: "Un-Authorized Operation. Only Area Incharges are authorized to carry out this operation." });
            }
        })
};