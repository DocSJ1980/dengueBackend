// Imports
import ErrorResponse from "../utils/Error.js"
import User from "../models/userModel.js"
import crypto from 'crypto'
import sendEmail from "../utils/sendEmail.js"
import { sendToken } from "../utils/sendToken.js"
import UC from "../models/ucModel.js"
import fs from 'fs'
import path from 'path'
import csv from 'fast-csv'


//FIRST ROUTE:  New User Registration controller
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

//SECOND ROUTE: Email Verification controller
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

//THIRD ROUTE: Login controller
export const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse("Please provide an email and password", 400));
    };

    try {
        const foundUser = await User.findOne({ email }).select("+password");
        if (!foundUser) {
            return next(new ErrorResponse("Invalid credentials", 401));
        };

        const isMatch = await foundUser.comparePassword(password);

        if (!isMatch) {
            return next(new ErrorResponse("Invalid credentials", 404));
        }

        sendToken(res, foundUser, 200, "Login Successful");

    } catch (error) {
        return next(new ErrorResponse("Login attemp un-successful", 400))
    }
};

//FOURTH ROUTE: Forgot Password controller
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

//FIFTH ROUTE: Reset Password Controller
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

//SIXTH ROUTE: Logout Controller
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

//SEVENTH ROUTE: Get profile controller
export const getMyProfile = async (req, res, next) => {
    try {
        const foundUser = await User.findById(req.user._id);

        sendToken(res, foundUser, 201, `Welcome back ${foundUser.username}`);
    } catch (error) {
        next(new ErrorResponse("Failed to load profile", 400))
    }
};

//EIGHTH ROUTE: Update Profile Controller
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

//NINTH ROUTE: Update Password Controller
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

//TENTH ROUTE: Batch create Users with CSV file
export const batchUsers = async (req, res, next) => {
    const allRecords = []
    try {
        //Using fast-csv to push all records from csvfile into allRecords
        const coolPath = path.join('./', '/public/csv/' + req.file.filename)
        const streamCSV = fs.createReadStream(coolPath)
        console.log(streamCSV)
        streamCSV.pipe(csv.parse({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', row => allRecords.push(row))
            .on('end', async rowCount => {
                let i = 0
                //Looping through allRecords array and inserting users one by one into database
                //It takes significant amount of time depending on the number of records
                //InsertMany records is possible but in this case it is not adviseable to insert many records in one go as it does not hash the passwords
                try {
                    while (i < rowCount) {
                        await User.create({
                            name: allRecords[i].name,
                            password: allRecords[i].password,
                            email: allRecords[i].email,
                            cnic: allRecords[i].cnic,
                            contactNo: allRecords[i].contactNo,
                            verified: allRecords[i].verified,
                            gender: allRecords[i].gender

                        })
                        console.log(`User-${i} created successfully`)
                        i++
                    }
                    return res.status(200).json(`${rowCount} Users created successfully`)
                }
                catch (error) {
                    return res.status(404).json("Users could not be insted in database")
                }
            }
            );
    } catch (error) {
        return next(new ErrorResponse("Failed to batch create users", 400))
    }
}

//ELEVENTH ROUTE: Assign staff to UC

export const assignStaff = async (req, res, next) => {
    try {
        //Simple self explanatory route to assign staff to UC
        //Only supervisors are able to assign staff to their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })

        //Checking if staff is already assigned as team member to a UC or working as supervisor of a UC
        const checkUC = await UC.findOne({ currentMembers: staff._id })
        const checkSuper = await UC.findOne({ "supervisor.currentSuper": staff._id })

        //Sending response if staff is already assigned as a team member to a UC
        if (checkUC) {
            return res.status(200).json(`${staff.name} is already working as team member in ${checkUC.survUC}`)
        }

        //Sending response if staff is already assigned as a supervisor to a UC
        else if (checkSuper) {
            return res.status(200).json(`${staff.name} is already working as supervisor in ${checkSuper.survUC}`)
        }

        //Assigning staff to UC and saving it
        else {
            foundUC.currentMembers.push(staff._id)
            await foundUC.save()
            return res.status(200).json(`${staff.name} is assigned to ${foundUC.survUC} successfully`)
        }
    }
    catch (e) {
        return res.status(401).json("Caught an error")
    }
}

//TWELVETH ROUTE: Search staff based on multiple fields

export const searchStaff = async (req, res, next) => {
    try {
        // Simple route self explanatory
        // console.log("block reached")
        const staff = await User.find({
            $or: [{ name: { $regex: req.params.key, $options: 'i' } },
            { cnic: { $regex: req.params.key, $options: 'i' } },
            { contactNo: { $regex: req.params.key, $options: 'i' } }]
        })
        //Returning results if found or not found
        if (staff) {
            console.log(staff.length)
            return res.status(200).json(staff)
        } else {
            return res.status(200).json("No user found")
        }
    } catch (e) {
        return res.status(401).json("Search Operation Error")
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

//Set Supervisor Route to assign a supervisor to UC 
export const setSupervisor = async (req, res, next) => {
    const superv = await User.findById(req.body.superID)
    const uc = await UC.findById(req.body.UCID)
    const checkUC = await UC.findOne({ "supervisor.currentSuper": req.body.superID })

    try {
        //Checking if provided ID for the supervisor exists in our user database
        // console.log("try block reached")
        if (!superv) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        // Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        // Checking if provided ID for the supervisor is already the supervisor of the any UC
        else if (checkUC) {
            console.log("super check reached")
            return res.status(200).json({
                success: true,
                message: `${superv.name} is already supervisor of ${checkUC.survUC}`
            })
        }
        // Assigning the provided ID for the supervisor as supervisor of the provided UC in a condition when there is already assigned supervisor
        // Already assigned supervisor will be moved to the list of past Supervisors along with the date of change
        else if (!uc.supervisor.currentSuper) {
            console.log("Supervisor assign block reached")
            // const oldSuper1 = await User.findById(uc.supervisor.currentSuper._id)
            // const oldSuper = oldSuper1._id
            // uc.supervisor.pastSuper.push(oldSuper)
            uc.supervisor.currentSuper = superv._id
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
