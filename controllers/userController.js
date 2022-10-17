// Imports
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import crypto from 'crypto'
import sendEmail from "../utils/sendEmail.js"
import { sendToken } from "../utils/sendToken.js"
import UC from "../models/ucModel.js"

// New User Registration controller
export const newUser = async (req, res, next) => {
    const { name, cnic, email, password } = req.body
    try {
        // const { avatar } = req.files;
        let foundUser = await User.findOne({ cnic })
        console.log(foundUser)
        if (foundUser) {
            return next(new ErrorResponse("User already exisits", 400))
        }

        const randomOtp = crypto.randomBytes(20).toString("hex")
        const otp = crypto
            .createHash("sha256")
            .update(randomOtp)
            .digest("hex")

        foundUser = await User.create({
            name,
            cnic,
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

//Batch create Users with CSV file
export const batchUsers = async (req, res, next) => {
    const allRecords = []
    try {
        const coolPath = path.join('./', '/public/csv/' + req.file.filename)
        const streamCSV = fs.createReadStream(coolPath)
        streamCSV.pipe(csv.parse({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', row => allRecords.push(row))
            .on('end', rowCount => {
                console.log(`Parsed ${rowCount} rows`)
                try {
                    const insertedUsers = User.insertMany(allRecords)
                    return res.status(200).json(`${rowCount} Users have been inserted`)
                } catch (error) {
                    return res.status(404).json("Could not be insted in database")
                }
            }
            );
    } catch (error) {
        return next(new ErrorResponse("Failed to batch create users", 400))
    }
}

export const followUser = async (req, res, next) => {
    try {
        const userToFollow = await User.findById(req.params.id)
        const loggedInUser = await User.findById(req.user._id)
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        if (loggedInUser.following.includes(userToFollow._id)) {
            console.log("reached")
            const indexfollowing = loggedInUser.following.indexOf(userToFollow._id)
            const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id)

            loggedInUser.following.splice(indexfollowing, 1)
            userToFollow.followers.splice(indexfollowers, 1)

            await loggedInUser.save()
            await userToFollow.save()

            return res.status(200).json({
                success: true,
                message: "User Un-Followed",
            })
        }
        else {
            loggedInUser.following.push(userToFollow.id);
            userToFollow.followers.push(loggedInUser._id);

            await loggedInUser.save();
            await userToFollow.save();

            res.status(200).json({
                success: true,
                message: "User followed",
            })
        }
    }
    catch (err) {
        return next(new ErrorResponse("Failed to Follow / Un-Follow", 400))
    }
}

export const getAllActivitiesOfFollowing = async (req, res, next) => {
    try {
        const loggedInUser = await User.findById(req.user._id)
        if (loggedInUser.following.includes(userToFollow._id)) {

            return res.status(200).json({
                success: true,
                message: "User Un-Followed",
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: "User followed",
            })
        }
    }
    catch (err) {
        return next(new ErrorResponse("Failed to Follow / Un-Follow", 400))
    }
}

export const setSupervisor = async (req, res, next) => {
    const superv = await User.findById(req.body.superID)
    const uc = await UC.findById(req.body.UCID)
    try {
        console.log("try block reached")
        if (!superv) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        } else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        } else if (uc.supervisor.equals(superv._id)) {
            console.log("super check reached")
            return res.status(404).json({
                success: false,
                message: `${superv.name} is already supervisor of ${uc.survUC}`
            })
        }
        else {
            uc.supervisor = superv._id
            console.log("final else reached")

            await uc.save()

            res.status(200).json({
                success: true,
                message: `${superv.name} assigned as supervisor to ${uc.survUC}`
            })
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${superv.name} as supervisor of ${uc.survUC}`, 400))
    }
}
