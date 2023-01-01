import User from "../models/userModel.js";

export const sendToken = async (res, foundUser, statusCode, message) => {
    const token = foundUser.getJWTToken();
    const sentUser = await User.findById(foundUser._id);
    const options = {
        httpOnly: true,
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
    };


    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({ success: true, message, user: sentUser, token: "Bearer " + token, });
};

