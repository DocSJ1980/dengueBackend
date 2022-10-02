// Imports
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import crypto from 'crypto'
import sendEmail from "../utils/sendEmail.js"
import { sendToken } from "../utils/sendToken.js"

// New User Registration controller
export const newUser = async (req, res, next) => {
    const { username, email, password } = req.body
    try {
        // const { avatar } = req.files;

        let foundUser = await User.findOne({ email })
        if (foundUser) {
            return next(new ErrorResponse("User already exisits", 400))
        }

        const randomOtp = crypto.randomBytes(20).toString("hex")
        const otp = crypto
            .createHash("sha256")
            .update(randomOtp)
            .digest("hex")
        console.log(otp)

        foundUser = await User.create({
            username,
            email,
            password,
            avatar: {
                public_id: "",
                url: ""
            },
            otp,
            otp_expiry: Date.now() + process.env.OTP_EXPIRE * 60 * 60 * 1000
        });

        const message = `Your OTP is ${otp}`

        await sendEmail(
            email, "Verify Your Accout", message
        )

        sendToken(
            res,
            foundUser,
            201,
            "OTP sent to your email, please verify your account"
        )
    } catch (error) {
        next(new ErrorResponse("Sorry account could not be created.", 400))
    }
};

// Email Verification controller
export const verify = async (req, res, next) => {
    try {
        const { otp } = req.body

        let foundUser = await User.findById(req.user._id)
        if (foundUser.otp !== otp || foundUser.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or has been Expired" });
        }
        foundUser.verified = true;
        foundUser.otp = null;
        foundUser.otp_expiry = null;

        await foundUser.save();
        console.log(foundUser)

        sendToken(res, foundUser, 200, "Account Verified");
    } catch (error) {
        next(new ErrorResponse("Sorry e-mail not verified", 400))
    }
};

// Login controller
export const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse("Please provide an email and password", 400));
    };

    try {
        const foundUser = await User.findOne({ email }).select("+password");
        console.log(foundUser)
        if (!foundUser) {
            return next(new ErrorResponse("Invalid credentials", 401));
        };

        const isMatch = await foundUser.comparePassword(password);

        if (!isMatch) {
            return next(new ErrorResponse("Invalid credentials", 404));
        }
        // const payload = {
        //     username: foundUser.username,
        //     id: foundUser._id,
        // }
        // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

        sendToken(res, foundUser, 200, "Login Successful");

    } catch (error) {
        return next(new ErrorResponse("Login attemp un-successful", 400))
    }
};

// Forgot Password controller
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return next(new ErrorResponse("Email could not be found", 404))
        }

        await foundUser.getResetPasswordToken()
        await foundUser.save()
        const resetToken = foundUser.resetPasswordOtp

        const resetUrl = `http://scraper.sjcloud.ga:5232/user/restpassword/?resetToken=${resetToken}`
        const message = `TODO= Reset URL: ${resetUrl}`
        try {
            await sendEmail(
                foundUser.email,
                "Password Reset Requeest",
                message
            )
            res.status(200).json({
                success: true,
                data: "Email sent"
            })
        } catch (error) {
            foundUser.resetPasswordOtp = undefined;
            foundUser.resetPasswordOtpExpiry = undefined;
            await foundUser.save();
            return next(new ErrorResponse("Email Could not be sent", 400))
        }
    } catch (error) {
        next(new ErrorResponse("Email not found", 400))
    }
}

// Reset Password Controller
export const resetPassword = async (req, res, next) => {
    try {
        const { resetOtp, newPassword } = req.body;

        const foundUser = await User.findOne({
            resetPasswordOtp: resetOtp,
            resetPasswordExpiry: { $gt: Date.now() },
        });

        if (!foundUser) {
            return res
                .status(400)
                .json({ success: false, message: "Otp Invalid or has been Expired" });
        }
        foundUser.password = newPassword;
        foundUser.resetPasswordOtp = null;
        foundUser.resetPasswordOtpExpiry = null;
        await foundUser.save();

        res
            .status(200)
            .json({ success: true, message: `Password Changed Successfully` });
    } catch (error) {
        next(new ErrorResponse("Email not found", 400))
    }
};

// Logout Controller
export const logout = async (req, res, next) => {
    try {
        res
            .status(200)
            .clearCookie("token")
            .json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        next(new ErrorResponse("Failed to logout", 400))

    }
};

// Get profile controller
export const getMyProfile = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.user._id);

        sendToken(res, foundUser, 201, `Welcome back ${foundUser.username}`);
    } catch (error) {
        next(new ErrorResponse("Failed to load profile", 400))
    }
};

// Update Profile Controller
export const updateProfile = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.user._id);

        const { username } = req.body;
        //   const avatar = req.files.avatar.tempFilePath;

        if (username) foundUser.username = username;
        //   if (avatar) {
        //     await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        //     const mycloud = await cloudinary.v2.uploader.upload(avatar);

        // fs.rmSync("./tmp", { recursive: true });

        // user.avatar = {
        //   public_id: mycloud.public_id,
        //   url: mycloud.secure_url,
        // };
        //   }

        await foundUser.save();

        res
            .status(200)
            .json({ success: true, message: "Profile Updated successfully" });
    } catch (error) {
        next(new ErrorResponse("Failed to update profile", 400))

    }
};

// Update Password Controller
export const updatePassword = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.user._id).select("+password");
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const isMatch = await foundUser.comparePassword(oldPassword);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Old Password" });
        }

        foundUser.password = newPassword;

        await foundUser.save();

        res
            .status(200)
            .json({ success: true, message: "Password Updated successfully" });
    } catch (error) {
        next(new ErrorResponse("Failed to update password", 400))
    }
};
