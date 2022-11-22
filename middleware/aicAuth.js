import jwt from "jsonwebtoken";
import { PolioDay } from "../models/polioTeamModel.js";
import User from "../models/userModel.js";

export const isAic = async (req, res, next) => {

    try {
        // console.log("isSuper try block reached")
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json(
                {
                    success: false,
                    message: "Login First"
                }
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.polioDay = await PolioDay.find({ "areaIncharge.currentAic": decoded._id })
        req.user = await User.findById(decoded._id);
        if (req.user.polioDay && req.user.user) {
            console.log(req.user.polioDay, req.user.user, "both found")
            next()
        } else {
            return res.status(401).json({ success: false, message: "Un-Authorized Operation. Only Area Incharges are authorized to carry out this operation." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};