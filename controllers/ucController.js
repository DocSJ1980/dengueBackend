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

export const polioMPGen = async (req, res, next) => {
    const { teamData } = req.body
    try {
        let i = 0
        while (i < teamData.length) {
            const { aicNumber, teams, fixedTeam, transitTeams } = teamData[i]
            const foundUC = await UC.findOne({ supervisor: req.user._id })
            if (foundUC) {
                const newAic = await Aic.create({ aicNumber })
                if (teams.length > 0) {
                    try {
                        for (let j = 0; j < teams.length; j++) {
                            const teamNo = teams[j]
                            const teamType = "Mobile"
                            const newPolioTeam = await PolioTeam.create({ teamNo, teamType })
                            try {
                                for (let dayNo = 1; dayNo < 6; dayNo++) {
                                    const newPolioDay = await PolioDay.create({ dayNo })
                                    newPolioTeam.polioDays.push(newPolioDay._id)
                                    await newPolioTeam.save()
                                }
                            } catch (error) {
                                return next(new ErrorResponse("Failed to create PolioDays", 404))
                            }
                            newAic.polioTeams.mobilePolioTeams.push(newPolioTeam._id)
                            await newAic.save()
                        }
                    } catch (error) {
                        return next(new ErrorResponse("Failed to create Mobile PolioTeam", 404))
                    }
                }
                if (fixedTeam.length > 0) {
                    try {
                        for (let k = 0; k < fixedTeam.length; k++) {
                            const teamNo = fixedTeam[k]
                            const teamType = "Fixed"
                            const newPolioTeam = await PolioTeam.create({ teamNo, teamType })
                            newAic.polioTeams.fixedPolioTeams.push(newPolioTeam._id)
                            await newAic.save()
                            console.log("FixedTeam block completed successfully")
                        }
                    } catch (error) {
                        return next(new ErrorResponse("Failed to create Fixed PolioTeam", 404))
                    }
                }
                if (transitTeams.length > 0) {
                    try {
                        for (let l = 0; l < transitTeams.length; l++) {
                            console.log("transitTeams block reached")
                            const teamNo = transitTeams[l]
                            const teamType = "Transit"
                            const newPolioTeam = await PolioTeam.create({ teamNo, teamType })
                            console.log("transitTeams created")
                            newAic.polioTeams.transitPolioTeams.push(newPolioTeam._id)
                            await newAic.save()
                        }
                    } catch (error) {
                        return next(new ErrorResponse("Failed to create Transit PolioTeam", 404))
                    }
                }
                // const createdSubUCs = { aic, polioTeams }
                foundUC.polioSubUCs.aic.push(newAic._id)
                await foundUC.save()
            }
            // console.log(foundUC)
            i++
        }
        return res.status(200).json("Endpoint reached")
    } catch (error) {
        return next(new ErrorResponse("Failed to Generate Polio Micro-Plan", 400))
    }
}