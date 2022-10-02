export const sendToken = (res, foundUser, statusCode, message) => {
    const token = foundUser.getJWTToken();

    const options = {
        httpOnly: true,
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
    };

    const userData = {
        _id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        avatar: foundUser.avatar,
        tasks: foundUser.tasks,
        verified: foundUser.verified,
    };

    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({ success: true, message, user: userData, token: "Bearer " + token, });
};

