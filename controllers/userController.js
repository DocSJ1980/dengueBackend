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
import DengueTeam from "../models/dengueTeamModel.js"


//FIRST ROUTE:  New User Registration controller
export const newUser = async (req, res, next) => {
    const { name, cnic, email, password, gender, desig, jobType } = req.body
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
            gender, desig, jobType,
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

//. 11TH ROUTE: Set Supervisor Route to assign a supervisor to UC 
export const setSuper = async (req, res, next) => {
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

//. 12TH ROUTE: Remove Supervisor Route to remove a supervisor from UC 
export const removeSuper = async (req, res, next) => {
    const superv = await User.findById(req.body.superID)
    const checkUC = await UC.findOne({ "supervisor.currentSuper": req.body.superID })

    try {
        //* Checking if provided ID for the supervisor exists in our user database
        //* console.log("try block reached")
        if (!superv) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Removing the provided ID for the supervisor from supervisorship of the already assigned UC in he is already assigned supervisor
        //* Already assigned supervisor will be moved to the list of past Supervisors along with the date of change
        else if (checkUC) {
            // console.log("Supervisor assign block reached")
            const oldSuper = superv._id
            checkUC.supervisor.pastSuper.push(oldSuper)
            checkUC.supervisor.currentSuper = null
            await checkUC.save()
            res.status(200).json({
                success: true,
                message: `${superv.name} removed from supervisorship of ${checkUC.survUC}`
            })
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Operation failed`, 400))
    }
}

//.12TH ROUTE: Search staff based on multiple fields
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

//13TH ROUTE: Assign staff to UC
export const assignStaff = async (req, res, next) => {
    try {
        //Simple self explanatory route to assign staff to UC
        //Only supervisors are able to assign staff to their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })

        //Check if user is already assigned to a dengueTeam or not. if yes then first remove from there
        const checkDT = await DengueTeam.findOne({ currentMembers: staff._id })
        const checkDTUC = await UC.findOne({ $or: [{ indoorTeams: checkDT._id }, { outdoorTeams: checkDT._id }] })

        //Checking if staff is already assigned as team member to a UC or working as supervisor of a UC
        const checkUC = await UC.findOne({ currentMembers: staff._id })
        const checkSuper = await UC.findOne({ "supervisor.currentSuper": staff._id })

        //Checking if staff is working in any dengue team
        if (checkDT) {
            return res.status(200).json(`${staff.name} cannot be removed as already working in ${checkDT.teamType} of ${checkDTUC.survUC}. Please remove from dengue team first`)
        }

        //Sending response if staff is already assigned as a team member to a UC
        else if (checkUC) {
            return res.status(200).json(`${staff.name} is already working as team member in ${checkUC.survUC}. Please remove to assign to ${foundUC.survUC}`)
        }

        //Sending response if staff is already assigned as a supervisor to a UC
        else if (checkSuper) {
            return res.status(200).json(`${staff.name} is already working as supervisor in ${checkSuper.survUC}. Please remove from supervisorship, to assign as team member to ${foundUC.survUC}`)
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

//14TH ROUTE: Remove staff from UC
export const removeStaff = async (req, res, next) => {
    try {
        //Simple self explanatory route to remove staff from UC
        //Only supervisors are able to remove staff from their UCs
        const staff = await User.findOne({ _id: req.body.staffID })
        const foundUC = await UC.findOne({ _id: req.fetchedUC._id })
        // console.log(foundUC.survUC, staff.name)
        //Check if user is already assigned to a dengueTeam or not. if yes then first remove from there
        const checkDT = await DengueTeam.findOne({ currentMembers: staff._id })
        const checkDTUC = await UC.findOne({ $or: [{ indoorTeams: checkDT._id }, { outdoorTeams: checkDT._id }] })
        // console.log(checkDT)

        //function for removing staff from UC
        function removeItemOnce(arr, value) {
            var index = arr.indexOf(value);
            if (index > -1) {
                arr.splice(index, 1);
            }
            return arr;
        }

        //Checking if staff is working in any dengue team
        if (checkDT) {
            return res.status(200).json(`${staff.name} cannot be assigned to ${foundUC.survUC} as already working in ${checkDT.teamType} of ${checkDTUC.survUC}. Please remove from dengue team first`)
        }

        //Removing staff from currentMembers of UC, saving the UC and sending success response
        else if (foundUC.currentMembers.includes(staff._id)) {
            // console.log(foundUC.currentMembers)
            foundUC.currentMembers = removeItemOnce(foundUC.currentMembers, staff._id)
            // console.log(foundUC.currentMembers)
            await foundUC.save()
            return res.status(200).json(`${staff.name} is removed from ${foundUC.survUC} successfully`)
        } else {
            return res.status(401).json(`${staff.name} is not currently working in ${foundUC.survUC} as team member`)
        }
    }
    catch (e) {
        return res.status(401).json("Operation not successful")
    }
}

//. 11TH ROUTE: Set Entomoligist Route to assign an entomologist to UC 
export const setEnto = async (req, res, next) => {
    const ento = await User.findById(req.body.entoID)
    const uc = await UC.findById(req.body.UCID)

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!ento) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        //* Checking if requested user is an entomologist or not
        else if (ento.desig != "Entomologist") {
            console.log(`${ento.name} is not entomologist and cannot be assigned as entomologist of UC: ${uc.survUC}. Please assign to an  appropriate staff.`)
            res.status(200).json({
                success: true,
                message: `Sorry ${ento.name} is not entomologist and cannot be assigned as entomologist of UC: ${uc.survUC}. Please assign to an  appropriate staff.`
            })
        }
        else if (ento.desig === "Entomologist") {
            //* Checking if an ento is already assigned or not
            if (uc.ento.currentEnto) {
                const alreadyEnto = await User.findById(uc.ento.currentEnto)
                console.log(`${alreadyEnto.name} is already Assigned as entomologist of UC: ${uc.survUC}. Please release`)
                res.status(200).json({
                    success: true,
                    message: `Sorry ${ento.name}cannot be assigned as entomologist of UC: ${uc.survUC}.  ${alreadyEnto.name} is already Assigned as entomologist, Please release`
                })
            }
            //* Assigning the provided ID for the entomolgist as entomologist of the provided UC
            else if (!uc.ento.currentEnto) {
                console.log("Entomologist assign block reached")
                uc.ento.currentEnto = ento._id
                await uc.save()
                res.status(200).json({
                    success: true,
                    message: `${ento.name} assigned as supervisor to ${uc.survUC}`
                })
            }
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${ento.name} as entomologist of ${uc.survUC}`, 400))
    }
}

//. 12TH ROUTE: Remove Entomologist Route to remove Entomologist from UC 
//! TODO Build the function below
export const removeEnto = async (req, res, next) => {
    const ento = await User.findById(req.body.entoID)
    const uc = await UC.findById(req.body.UCID)

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!ento) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        //* Checking if requested user is an entomologist or not
        else if (ento.desig != "Entomologist") {
            console.log(`${ento.name} is not entomologist.`)
            res.status(200).json({
                success: true,
                message: `Sorry ${ento.name} is not entomologist `
            })
        }
        else if (ento.desig === "Entomologist") {
            //* Checking if an ento is already assigned or not
            //* Assigning the provided ID for the entomolgist as entomologist of the provided UC
            if (!uc.ento.currentEnto) {
                console.log("No Entomologist assigned")
                res.status(200).json({
                    success: true,
                    message: `Sorry! No entomologist is already assigned as entomologist to ${uc.survUC}`
                })
            }
            else if (uc.ento.currentEnto) {
                const alreadyEnto = await User.findById(uc.ento.currentEnto)
                const oldEnto = alreadyEnto._id
                uc.ento.currentEnto = null
                uc.ento.pastEntos.push(oldEnto)
                await uc.save()
                console.log(`${alreadyEnto.name} is removed from entomologist of UC: ${uc.survUC} and added to the list of past entomologists.`)
                res.status(200).json({
                    success: true,
                    message: `${alreadyEnto.name} is removed from entomologist of UC: ${uc.survUC} and added to the list of past entomologists.`
                })
            }
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to remove ${ento.name} from entomologist of ${uc.survUC}`, 400))
    }
}

//. 13TH ROUTE: Set Town Entomoligist Route to assign Town entomologist to Town 
export const setTownEnto = async (req, res, next) => {
    const townEnto = await User.findById(req.body.entoID)
    const ucs = await UC.find({ town: req.body.townID })

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!townEnto) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!ucs) {
            return res.status(404).json({
                success: false,
                message: "Town not found",
            })
        }

        //* Checking if requested user is an entomologist or not
        if (townEnto.desig === "Entomologist") {
            let breakCheck = false
            for (const uc of ucs) {
                //* Checking if requested user is an entomologist or not
                console.log(uc.survUC, !uc.townEnto.currentTownEnto)


                if (!uc.townEnto.currentTownEnto) {
                    uc.townEnto.currentTownEnto = townEnto._id
                    console.log(uc.townEnto.currentTownEnto)
                    await uc.save()
                    console.log(`${townEnto.name} successfully assigned as town Entomologist for the UC: ${uc.survUC}`)
                } else if (uc.townEnto.currentTownEnto) {
                    res.status(200).json({
                        success: true,
                        message: `Sorry! Cannot assign ${townEnto.name} as Town Entomologist for requested town, as ${uc.survUC} already has a town entomologist assigned. Please release the town entomologist`
                    })
                    breakCheck = true
                    break;
                }
            }
            if (!breakCheck) {
                res.status(200).json({
                    success: true,
                    message: `Successfully assigned ${townEnto.name} as Town Entomologist for requested town`
                })
            }
        } else if (townEnto.desig != "Entomologist") {
            res.status(200).json({
                success: true,
                message: `Sorry! ${townEnto.name} is not an entomologist. Please assign an entomologist as Town Entomologist for the requested town`
            })
        }

    }
    catch (err) {
        return next(new ErrorResponse(`Failed to set ${townEnto.name} as Town entomologist of requested Town`, 400))
    }
}

//. 14TH ROUTE: Remove Town Entomologist Route to remove Townn Entomologist from a Town 
//! TODO Build the function below
export const removeTownEnto = async (req, res, next) => {
    const ento = await User.findById(req.body.entoID)
    const uc = await UC.findById(req.body.UCID)

    try {
        //* Checking if provided ID for the entomologist exists in our user database
        // console.log("try block reached")
        if (!ento) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        //* Checking if provided ID for the UC exists in our UC database
        else if (!uc) {
            return res.status(404).json({
                success: false,
                message: "UC not found",
            })
        }
        //* Checking if requested user is an entomologist or not
        else if (ento.desig != "Entomologist") {
            console.log(`${ento.name} is not entomologist.`)
            res.status(200).json({
                success: true,
                message: `Sorry ${ento.name} is not entomologist `
            })
        }
        else if (ento.desig === "Entomologist") {
            //* Checking if an ento is already assigned or not
            //* Assigning the provided ID for the entomolgist as entomologist of the provided UC
            if (!uc.ento.currentEnto) {
                console.log("No Entomologist assigned")
                res.status(200).json({
                    success: true,
                    message: `Sorry! No entomologist is already assigned as entomologist to ${uc.survUC}`
                })
            }
            else if (uc.ento.currentEnto) {
                const alreadyEnto = await User.findById(uc.ento.currentEnto)
                const oldEnto = alreadyEnto._id
                uc.ento.currentEnto = null
                uc.ento.pastEntos.push(oldEnto)
                await uc.save()
                console.log(`${alreadyEnto.name} is removed from entomologist of UC: ${uc.survUC} and added to the list of past entomologists.`)
                res.status(200).json({
                    success: true,
                    message: `${alreadyEnto.name} is removed from entomologist of UC: ${uc.survUC} and added to the list of past entomologists.`
                })
            }
        }
    }
    catch (err) {
        return next(new ErrorResponse(`Failed to remove ${ento.name} from entomologist of ${uc.survUC}`, 400))
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

