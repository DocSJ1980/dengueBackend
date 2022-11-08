// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"
import fs from 'fs'
import path from 'path'
import csv from 'fast-csv'
import { Url } from "url"
const __dirname = new Url('.', import.meta.url).pathname
import { Aic, PolioTeam, PolioDay } from "../models/polioTeamModel.js"

//FIRST ROUTE: Get all the simple activities
export const fetchAllUCs = async (req, res, next) => {
    try {
        const fetchedUC = await UC.find({}, {}, { sort: { ucSort: -1 } });
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

//SIXTH ROUTE: Create polio micor-plan with team data from frontend
export const polioMPGen = async (req, res, next) => {
    //Destructuring team data from frontend
    const { teamData } = req.body
    //Finding UC from logged in user and checking if he is supervisor or not
    const foundUC = await UC.findOne({ supervisor: req.user._id })
    if (foundUC) {
        //Creating aic, polioTeams and polioDays
        try {
            let i = 0
            //Creating aics looping through teamData array
            while (i < teamData.length) {
                const { aicNumber, mobileTeams, fixedTeam, transitTeams } = teamData[i]
                const newAic = await Aic.create({ aicNumber })
                //Creating mobilePolioTeams looping on the length of mobileTeams array in teamData 
                if (mobileTeams.length > 0) {
                    try {
                        for (let j = 0; j < mobileTeams.length; j++) {
                            const teamNo = mobileTeams[j]
                            const teamType = "Mobile"
                            const newPolioTeam = await PolioTeam.create({ teamNo, teamType })
                            //Creating 5 days for each mobilePolioTeam
                            try {
                                for (let dayNo = 1; dayNo < 6; dayNo++) {
                                    const newPolioDay = await PolioDay.create({ dayNo })
                                    //Referencing created day in the loop to newPolioTeam in the loop and saving the team 
                                    newPolioTeam.polioDays.push(newPolioDay._id)
                                    await newPolioTeam.save()
                                }
                            } catch (error) {
                                return next(new ErrorResponse("Failed to create PolioDays", 404))
                            }
                            //Referencing newPolioTeam along with created and referenced days in the above loop to newAic in the loop and saving aic 
                            newAic.polioTeams.mobilePolioTeams.push(newPolioTeam._id)
                            await newAic.save()
                        }
                    } catch (error) {
                        return next(new ErrorResponse("Failed to create Mobile PolioTeam", 404))
                    }
                }
                //Creating fixedPolioTeams looping on the length of fixedTeams array in teamData 
                if (fixedTeam.length > 0) {
                    try {
                        //Referencing newPolioTeam to newAic in the loop and saving aic 
                        for (let k = 0; k < fixedTeam.length; k++) {
                            const teamNo = fixedTeam[k]
                            const teamType = "Fixed"
                            const newPolioTeam = await PolioTeam.create({ teamNo, teamType })
                            newAic.polioTeams.fixedPolioTeams.push(newPolioTeam._id)
                            await newAic.save()
                        }
                    } catch (error) {
                        return next(new ErrorResponse("Failed to create Fixed PolioTeam", 404))
                    }
                }
                //Creating transitPolioTeams looping on the length of transitTeams array in teamData 
                if (transitTeams.length > 0) {
                    try {
                        //Referencing newPolioTeam to newAic in the loop and saving aic 
                        for (let l = 0; l < transitTeams.length; l++) {
                            console.log("transitTeams block reached")
                            const teamNo = transitTeams[l]
                            const teamType = "Transit"
                            const newPolioTeam = await PolioTeam.create({ teamNo, teamType })
                            newAic.polioTeams.transitPolioTeams.push(newPolioTeam._id)
                            await newAic.save()
                        }
                    } catch (error) {
                        return next(new ErrorResponse("Failed to create Transit PolioTeam", 404))
                    }
                }
                // pushing newAic in the loop to foundUC and saving UC 
                foundUC.polioSubUCs.aic.push(newAic._id)
                await foundUC.save()
                i++
            }
            return res.status(200).json("Area Incharges and mobile, transit and fixed teams created successfully")
        } catch (error) {
            return next(new ErrorResponse("Failed to Generate Polio Micro-Plan", 400))
        }
    } else {
        return res.status(404).json("You are not supervisor of requested UC")
    }
}

//SEVENTH ROUTE: Get UC details of logged in user
export const fetchUC = async (req, res, next) => {
    try {
        const fetchedUC = await UC.findOne({ supervisor: req.user._id })
            .populate({
                path: 'polioSubUCs.aic',
                model: Aic,
                populate: {
                    path: 'polioTeams.mobilePolioTeams polioTeams.fixedPolioTeams polioTeams.transitPolioTeams',
                    model: PolioTeam,
                    populate: {
                        path: 'polioDays',
                        model: PolioDay
                    }
                }
            });
        res.json(fetchedUC);
    } catch (error) {
        res.json("No UC Found")
    }
};

//EIGHT ROUTE: Purge Polio Micro-Plan
export const polioMPPurge = async (req, res, next) => {
    try {
        const fetchedUC = await UC.findOne({ supervisor: req.user._id })
        let i = 0
        while (i < fetchedUC.polioSubUCs.aic.length) {
            const fetchedAic = await Aic.findOne({ _id: fetchedUC.polioSubUCs.aic[i] })
            let j = 0
            console.log(fetchedAic.polioTeams.mobilePolioTeams.length, fetchedAic.polioTeams.fixedPolioTeams.length, fetchedAic.polioTeams.transitPolioTeams.length)
            while (j < fetchedAic.polioTeams.mobilePolioTeams.length) {
                const fetchedPolioTeam = await PolioTeam.findOne({
                    _id: fetchedAic.polioTeams.mobilePolioTeams[j]
                })
                let k = 0
                while (k < fetchedPolioTeam.polioDays.length) {
                    await PolioDay.findByIdAndDelete({ _id: fetchedPolioTeam.polioDays[k] })
                    k++
                }
                await PolioTeam.findByIdAndDelete({
                    _id: fetchedAic.polioTeams.mobilePolioTeams[j]
                })
                j++
            }
            j = 0
            if (fetchedAic.polioTeams.fixedPolioTeams.length > 0) {
                while (j < fetchedAic.polioTeams.fixedPolioTeams.length) {
                    await PolioTeam.findByIdAndDelete({
                        _id: fetchedAic.polioTeams.fixedPolioTeams[j]
                    })
                    j++
                }
            }
            j = 0
            if (fetchedAic.polioTeams.transitPolioTeams.length > 0) {
                while (j < fetchedAic.polioTeams.transitPolioTeams.length) {
                    await PolioTeam.findByIdAndDelete({
                        _id: fetchedAic.polioTeams.transitPolioTeams[j]
                    })
                    j++
                }
            }
            await Aic.findByIdAndDelete({ _id: fetchedUC.polioSubUCs.aic[i] })
            i++
        }
        fetchedUC.polioSubUCs = []
        await fetchedUC.save()
        res.json(fetchedUC);
    } catch (error) {
        res.json("Purge Operations Failed")
    }
};
