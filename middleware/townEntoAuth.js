import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const isTownEnto = async (req, res, next) => {

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
            if (req.user.desig === "DDHO" || req.user.desig === "Entomologist") {
                // Check the logic of the above if statement and refactor if required
                next()
            } else {
                return res.status(401).json({ success: false, message: "Un-Authorized Operation. Only Town Entomologists and DDHOs are authorized to carry out this operation." });
            }
        })

};