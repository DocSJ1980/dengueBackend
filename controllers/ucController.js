// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"
import fs from 'fs'
import path from 'path'
import csv from 'fast-csv'
import { Aic, PolioTeam, PolioDay } from "../models/polioTeamModel.js"
import User from "../models/userModel.js"

// import { Url } from "url"
// const __dirname = new Url('.', import.meta.url).pathname

//. FIRST ROUTE: Get all the UCs for a town
export const fetchAllUCs = async (req, res, next) => {
    try {
        const townID = req.body.townID
        const fetchedUC = await UC.find({ town: townID }, { _id: 1, survUC: 1 }, { sort: { ucSort: 1 } });
        res.json(fetchedUC);
    } catch (error) {
        res.json("No UC Found")
    }
};

//SECOND ROUTE: Add new UC
export const newUC = async (req, res, next) => {
    //Implementing try/catch block to avoid any errors or unexpected behaviour
    try {

        const { town, ucSort, trackingUC, survUC, pop2021, pop2022, ucType, houses, spots, supervisor, ento, townEnto, ddho } = req.body
        const foundUC = await UC.findOne({ survUC: survUC });
        console.log(foundUC)
        if (foundUC) {
            res.json({ "message": "UC already exisits", foundUC });
        }
        // TODO Need to refactor to add supervisor, ento, townEnto, ddho
        if (!foundUC) {
            const newUC = await UC.create({ town, ucSort, trackingUC, survUC, pop2021, pop2022, ucType, houses, spots });
            res.json(`UC Created against ID: ${newUC._id}`);
        }
    }
    //Try statement completed, now catching errors if above not successful.
    catch (error) {
        return next(new ErrorResponse("Failed to create UC", 404))
    }
}

//THIRD ROUTE: Update an existing UC
export const updateUC = async (req, res, next) => {
    const { town, ucSort, trackingUC, survUC, pop2021, pop2022, ucType, houses, spots, supervisor, ento, townEnto, ddho } = req.body;
    //Implementing try/catch block to avoid any errors or unexpected behaviour
    try {
        //Create new note object
        const tmpUC = {};
        if (town) { tmpUC.town = town };
        if (ucSort) { tmpUC.ucSort = ucSort };
        if (trackingUC) { tmpUC.trackingUC = trackingUC };
        if (survUC) { tmpUC.survUC = survUC };
        if (pop2021) { tmpUC.pop2021 = pop2021 };
        if (pop2022) { tmpUC.pop2022 = pop2022 };
        if (houses) { tmpUC.houses = houses };
        if (spots) { tmpUC.spots = spots };
        if (supervisor) { tmpUC.supervisor = supervisor };
        if (ento) { tmpUC.ento = ento };
        if (townEnto) { tmpUC.townEnto = townEnto };
        if (ddho) { tmpUC.ddho = ddho };

        //Check if note belongs to logged in user and check if no note found
        if (!UC) { return res.status(404).send("Not Found") }

        //if above condtions found true then update the note and return in response 
        const updatedUC = await UC.findByIdAndUpdate(req.params.id, { $set: tmpUC }, { new: true })
        res.json({ updatedUC });
    }
    //Try statement completed, now catching errors if above not successful.
    catch (error) {
        return next(new ErrorResponse("Failed to update UC", 400))
    }
}
//FOURTH ROUTE: Update an existing simple Activity
export const deleteUC = async (req, res) => {
    try {
        let foundUC = await UC.findById(req.params.id);
        if (!foundUC) { return res.status(404).send("Not Found") }

        const deletedUC = await UC.findByIdAndDelete(req.params.id)
        res.json({ "Success": "UC has been deleted" });
    }
    //Try statement completed, now catching errors if above not successful.
    catch (error) {
        return next(new ErrorResponse("Failed to delete UC", 400))
    }
}

//FIFTH ROUTE: Batch create UCs with CSV file
export const batchUCs = async (req, res, next) => {
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
                    const insertedUCs = UC.insertMany(allRecords)
                    return res.status(200).json(`${rowCount} UCs have been inserted`)
                } catch (error) {
                    return res.status(404).json("Could not be insted in database")
                }
            }
            );
    } catch (error) {
        return next(new ErrorResponse("Failed to batch create UCs", 400))
    }
}

//SIXTH ROUTE: Get UC details of logged in user
export const fetchUC = async (req, res, next) => {
    try {
        //Finding UC with UC assigned to user as supervisor or UC member
        const fetchedUC = await UC.findById(req.body.ucID)
            .populate({
                path: 'polioSubUCs',
                populate: {
                    path: 'aic',
                    model: Aic,
                    populate: [
                        { path: 'areaIncharge.currentAic', model: User },
                        { path: 'areaIncharge.pastAics._id', model: User },
                        {
                            path: 'polioTeams.mobilePolioTeams polioTeams.fixedPolioTeams polioTeams.transitPolioTeams', model: PolioTeam,
                            populate: {
                                path: 'polioDays',
                                model: PolioDay
                            }
                        }]
                }
            })
            .populate({ path: 'currentMembers', model: User })
            .populate({ path: 'supervisor.currentSuper', model: User })
            .populate({
                path: 'supervisor.pastSuper._id',
                model: User
            })
            .populate({ path: 'ento.currentEnto', model: User })
            .populate({
                path: 'ento.pastEntos._id',
                model: User
            })
            .populate({ path: 'townEnto.currentTownEnto', model: User })
            .populate({
                path: 'townEnto.pastTownEntos._id',
                model: User
            })
            .populate({ path: 'ddho.currentDdho', model: User })
            .populate({
                path: 'ddho.pastDdhos._id',
                model: User
            })
        //Returning UC details if no polio microplan is present
        // if (fetchedUC.polioSubUCs.aic.length === 0) {
        //     console.log("No aic")
        //     res.json(fetchedUC);
        // }
        // if (!fetchedUC.polioSubUCs) {
        //     console.log("No polioSubUCs")
        //     res.json(fetchedUC);
        // }

        // //Returning UC details if polio microplan is present with completely populated UC
        // if (fetchedUC.polioSubUCs.aic.length > 0) {
        //     console.log("Aic found")
        //     fetchedUC = await UC.findOne({ $or: [{ "supervisor.currentSuper": req.user._id }, { currentMembers: req.user._id }] }).populate({
        //         path: 'polioSubUCs',
        //         populate: {
        //             path: 'aic',
        //             model: Aic,
        //             populate: {
        //                 path: 'polioTeams.mobilePolioTeams polioTeams.fixedPolioTeams polioTeams.transitPolioTeams',
        //                 model: PolioTeam,
        //                 populate: {
        //                     path: 'polioDays',
        //                     model: PolioDay
        //                 }
        //             }
        //         }
        //     }).populate({ path: 'currentMembers', model: User })
        res.json(fetchedUC);
        // }
    } catch (error) {
        return next(new ErrorResponse("Failed to fetch UC details", 404))
    }
};

//SIXTH ROUTE: Get UC details of logged in user
export const fetchMyUC = async (req, res, next) => {
    try {
        //Finding UC with UC assigned to user as supervisor or UC member
        let fetchedUC = await UC.find({ $or: [{ currentMembers: req.user._id }, { "supervisor.currentSuper": req.user._id }, { "ento.currentEnto": req.user._id }, { "townEnto.currentTownEnto": req.user._id }, { "ddho.currentDdho": req.user._id }] }, { _id: 1, survUC: 1 }, { sort: { ucSort: 1 } })

        //Returning UC details if no polio microplan is present
        if (fetchedUC.length === 0) {
            console.log("No UC Found")
            res.json(fetchedUC);
        } else {
            console.log(fetchedUC)
            res.status(200).json(fetchedUC);
        }
    } catch (error) {
        return next(new ErrorResponse("Failed to fetch UC details", 404))
    }
};

