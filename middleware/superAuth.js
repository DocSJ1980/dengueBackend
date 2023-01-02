import jwt from "jsonwebtoken";
import UC from "../models/ucModel.js";
import User from "../models/userModel.js";

export const isSuper = async (req, res, next) => {

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
            req.user = await User.findById(decoded._id);
            req.fetchedUC = await UC.findOne({ "supervisor.currentSuper": req.user._id })
            if (req.fetchedUC) {
                next()
            } else {
                return res.status(401).json({ success: false, message: "Un-Authorized Operation. Only supervisors are authorized to assign staff to UC." });
            }
        })
};