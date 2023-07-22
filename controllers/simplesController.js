// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import { response } from "express";
import SimpleActivity from "../models/simplesModel.js"
import UC from "../models/ucModel.js";
import User from "../models/userModel.js";
import ErrorResponse from "../utils/Error.js"
import res from "express/lib/response.js";

//FIRST ROUTE: Get all the simple activities
export const fetchAllSimpleActivities = async (req, res, next) => {
    try {
        const simpleActivity = await SimpleActivity.findOne({}, {}, { sort: { dateSubmitted: -1 } });
        res.json(simpleActivity.dateSubmitted);
    } catch (error) {
        res.json("2022-08-31T19:00:00.000Z")
    }
};

//SECOND ROUTE: Add simple activity
export const newSimpleActivity = async (req, res, next) => {
    //Implementing try/catch block to avoid any errors or unexpected behaviour
    try {

        const { pitbid, district, town, uc, department, tag, larvaFound, dengueLarva, lat, long, beforePic, afterPic, timeDiff, userName, dateSubmitted, bogus } = req.body
        // console.log(dateSubmitted)
        const location = { coordinates: [long, lat] }
        const activitySub = await SimpleActivity.findOne({ pitbid: pitbid });
        if (activitySub) {
            res.json({ "message": "Activity already exisits", activitySub });
        }
        if (!activitySub) {
            const simpleActivity = await SimpleActivity.create({ pitbid, district, town, uc, department, tag, larvaFound, dengueLarva, location, beforePic, afterPic, timeDiff, userName, dateSubmitted, bogus });
            res.json(`Activity Submitted against pitbid: ${simpleActivity.pitbid}`);
        }

    }
    //Try statement completed, now catching errors if above not successful.
    catch (error) {
        return next(new ErrorResponse("Failed to submit simple activity", 404))
    }
}

//THIRD ROUTE: Like & Unlike simple Activity
export const likeUnlike = async (req, res, next) => {
    try {
        const foundActivity = await SimpleActivity.findById(req.params.id)

        if (!foundActivity) {
            return next(new ErrorResponse("Activity not found", 404))
        }
        if (foundActivity.likes.includes(req.user._id)) {
            console.log(req.user._id)
            const index = foundActivity.likes.indexOf(req.user._id)
            foundActivity.likes.splice(index, 1)
            await foundActivity.save()
            return res.status(200).json({
                success: "true",
                message: "Activity Unliked"
            })
        } else {
            foundActivity.likes.push(req.user._id)
            await foundActivity.save()
            return res.status(200).json({
                success: "true",
                message: "Activity Liked"
            })
        }
    } catch (error) {
        return next(new ErrorResponse("Failed to like simple activity", 404))
    }
}

//THIRD ROUTE: Update an existing simple activity
export const updateSimpleActivity = async (req, res, next) => {
    const { pitbid, district, town, uc, department, tag, larvaFound, dengueLarva, location, beforePic, afterPic, timeDiff, userName, dateSubmitted, bogus } = req.body;
    //Implementing try/catch block to avoid any errors or unexpected behaviour
    try {
        //Create new note object
        const tmpSimpleActivity = {};
        if (pitbid) { tmpSimpleActivity.pitbid = pitbid };
        if (district) { tmpSimpleActivity.district = district };
        if (town) { tmpSimpleActivity.town = town };
        if (uc) { tmpSimpleActivity.uc = uc };
        if (department) { tmpSimpleActivity.department = department };
        if (tag) { tmpSimpleActivity.tag = tag };
        if (larvaFound) { tmpSimpleActivity.larvaFound = larvaFound };
        if (dengueLarva) { tmpSimpleActivity.dengueLarva = dengueLarva };
        if (location) { tmpSimpleActivity.location = location };
        if (beforePic) { tmpSimpleActivity.beforePic = beforePic };
        if (afterPic) { tmpSimpleActivity.afterPic = afterPic };
        if (timeDiff) { tmpSimpleActivity.timeDiff = timeDiff };
        if (userName) { tmpSimpleActivity.userName = userName };
        if (dateSubmitted) { tmpSimpleActivity.dateSubmitted = dateSubmitted };
        if (bogus) { tmpSimpleActivity.bogus = bogus };

        //Find the note to be updated and store
        let simpleActivity = await SimpleActivity.findById(req.params.id);

        //Check if note belongs to logged in user and check if no note found
        if (!simpleActivity) { return res.status(404).send("Not Found") }

        //if above condtions found true then update the note and return in response 
        const updatedSimpleActivity = await Notes.findByIdAndUpdate(req.params.id, { $set: tmpSimpleActivity }, { new: true })
        res.json({ updatedSimpleActivity });
    }
    //Try statement completed, now catching errors if above not successful.
    catch (error) {
        return next(new ErrorResponse("Failed to update simple activity", 400))
    }
}
//FOURTH ROUTE: Update an existing simple Activity
export const deleteSimpleActivity = async (req, res) => {
    try {
        let simpleActivity = await SimpleActivity.findById(req.params.id);
        if (!simpleActivity) { return res.status(404).send("Not Found") }

        const deletedSimpleActivity = await SimpleActivity.findByIdAndDelete(req.params.id)
        res.json({ "Success": "Simple Activity has been deleted", note: note });
    }
    //Try statement completed, now catching errors if above not successful.
    catch (error) {
        return next(new ErrorResponse("Failed to delete simple activity", 400))
    }
}

// Fifth Route: batch submit simples activities
export const batchSimples = async (req, res, next) => {
    const { allActivities } = req.body
    // console.log("countActivities: ", allActivities.length)
    // console.log(allActivities)
    try {
        // const insertedSimples = await SimpleActivity.insertMany(allActivities)
        const countActivities = allActivities.length
        let i = 0
        let notSubmitted = 0
        let activitySubmitted = 0
        while (i < countActivities) {
            try {
                // const owner = await User.findOne({ cnic: allActivities[i].userName }, { _id: 1 })
                // allActivities[i].owner = owner._id
                await SimpleActivity.create(allActivities[i])
                activitySubmitted++
                // console.log("Submitted: ", activitySubmitted)
            } catch (error) {
                notSubmitted++
                // console.log("Not Submitted error: ", error)
            }
            i++
        }
        return res.status(200).json(`Activities submitted = ${activitySubmitted} Activities not submitted = ${notSubmitted}`)
    } catch (error) {
        return next(new ErrorResponse("Failed to batch submit simple activities", 400))
    }
}

//. 6th Route: Get all simple activities from UCs indoor and outdoor teams

export const getAllSimples = async (req, res, next) => {
    const page = req.query.page || 0
    const activitiesPerPage = 20
    console.log("request received for Page: " + page)
    const ucList = await UC.find({
        $or: [
            { "supervisor.currentSuper": req.user._id },
            { "ento.currentEnto": req.user._id },
            { "townEnto.currentTownEnto": req.user._id },
            { "ddho.currentDdho": req.user._id },
            { "currentMembers": req.user._id },
        ]
    })
    const ucMembers = []
    for (const uc of ucList) {
        for (const member of uc.currentMembers) {
            const memberCNIC = await User.findOne({ _id: member }, { cnic: 1 })
            ucMembers.push(memberCNIC.cnic)
        }
    }
    console.log(ucMembers)
    const activities = await SimpleActivity
        .find({ userName: { $in: ucMembers } })
        .skip(page * activitiesPerPage)
        .limit(activitiesPerPage)
    return res.status(200).json(activities)
}

export const getLastActivityDate = async (req, res) => {
    try {
        const lastActivity = await SimpleActivity.findOne({}, { dateSubmitted: 1 })
            .sort({ dateSubmitted: -1 })
            .lean();
        if (lastActivity) {
            const lastActivityDate = lastActivity.dateSubmitted;
            // Use the lastActivityDate as needed
            return res.status(200).json(lastActivityDate);
        } else {
            // No activities found
            return res.status(404).json("No activities found");
        }
    } catch (err) {
        return res.status(500).json("Internal Server Error");
        // Handle the error
    }
}

export const getLastActivityDateFromDate = async (req, res) => {
    const { checkDate } = req.body;
    // console.log(checkDate)
    const startDate = new Date(checkDate);
    startDate.setUTCHours(0, 0, 0, 0);
    console.log("StartDate: ", startDate)
    const newStartDate = new Date(startDate)

    newStartDate.setHours(newStartDate.getHours() - 5);
    // newStartDate.setHours(19, 0, 0); // Set time to 19:00:00
    console.log("New StartDate: ", newStartDate);
    const endDate = new Date(checkDate);
    endDate.setUTCHours(23, 59, 59, 999);
    endDate.setHours(18, 59, 59);
    // console.log("EndDate: ", endDate)

    try {
        const lastActivity = await SimpleActivity.findOne({
            dateSubmitted: {
                $gte: startDate,
                $lte: endDate,
            },
        }, { dateSubmitted: 1 })
            .sort({ dateSubmitted: -1 })
            .lean();
        if (lastActivity) {
            const lastActivityDate = lastActivity.dateSubmitted;
            console.log(lastActivityDate)
            // Use the lastActivityDate as needed
            return res.status(200).json(lastActivityDate);
        } else {
            // No activities found
            // Convert the startDate to a Date object
            const dateObject = new Date(startDate);

            // Subtract 5 hours from the dateObject
            dateObject.setHours(dateObject.getHours() - 5);

            // Return the updated date as a JSON response
            return res.status(200).json(dateObject);
        }
    } catch (err) {
        return res.status(500).json("Internal Server Error");
        // Handle the error
    }
}

