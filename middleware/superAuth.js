import jwt from "jsonwebtoken";
import UC from "../models/ucModel.js";
import User from "../models/userModel.js";

export const isSuper = async (req, res, next) => {

    try {
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

        req.user = await User.findById(decoded._id);
        req.fetchedUC = await UC.findOne({ "supervisor.currentSuper": req.user._id })
        // console.log(req.fetchedUC)
        if (req.fetchedUC) {
            next()
        } else {
            return res.status(401).json({ success: false, message: "Un-Authorized Operation. Only supervisors are authorized to assign staff to UC." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};