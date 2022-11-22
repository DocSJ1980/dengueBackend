import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const isTownEnto = async (req, res, next) => {

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

        req.user = await User.findById(decoded._id);
        if (req.user.desig === "DDHO" || req.user.desig === "Entomologist") {
            next()
        } else {
            return res.status(401).json({ success: false, message: "Un-Authorized Operation. Only Town Entomologists and DDHOs are authorized to carry out this operation." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};