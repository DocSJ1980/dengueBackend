import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"
import { Aic, PolioTeam, PolioDay } from "../models/polioTeamModel.js"

//FIRST ROUTE: Create polio micor-plan with team data from frontend
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
        return next(new ErrorResponse("You are not supervisor of requested UC", 404))
    }
}

//SECOND ROUTE: Purge Polio Micro-Plan
export const polioMPPurge = async (req, res, next) => {
    try {
        //Finding the UC from logged in user
        const fetchedUC = await UC.findOne({ supervisor: req.user._id })
        //Looping through each Aic found inside the polioSubUCs of UC of the supervisor
        let i = 0
        while (i < fetchedUC.polioSubUCs.aic.length) {
            //Getting Aic from id in polioSubUCs
            const fetchedAic = await Aic.findOne({ _id: fetchedUC.polioSubUCs.aic[i] })
            let j = 0
            //Deleting mobilePolioTeams one by one from IDs in Aic
            if (fetchedAic.polioTeams.mobilePolioTeams.length > 0) {
                while (j < fetchedAic.polioTeams.mobilePolioTeams.length) {
                    const fetchedPolioTeam = await PolioTeam.findOne({
                        _id: fetchedAic.polioTeams.mobilePolioTeams[j]
                    })
                    //Deleting polioDays
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
            }
            //Deleting fixedPolioTeams one by one from IDs in Aic
            j = 0
            if (fetchedAic.polioTeams.fixedPolioTeams.length > 0) {
                while (j < fetchedAic.polioTeams.fixedPolioTeams.length) {
                    await PolioTeam.findByIdAndDelete({
                        _id: fetchedAic.polioTeams.fixedPolioTeams[j]
                    })
                    j++
                }
            }
            //Deleting transitPolioTeams one by one from IDs in Aic
            j = 0
            if (fetchedAic.polioTeams.transitPolioTeams.length > 0) {
                while (j < fetchedAic.polioTeams.transitPolioTeams.length) {
                    await PolioTeam.findByIdAndDelete({
                        _id: fetchedAic.polioTeams.transitPolioTeams[j]
                    })
                    j++
                }
            }
            //Deleting Aic after deleting all the teams and their polioDays
            await Aic.findByIdAndDelete({ _id: fetchedUC.polioSubUCs.aic[i] })
            i++
        }
        //Removing Aic IDs from polioSubUCs
        fetchedUC.polioSubUCs = []
        await fetchedUC.save()
        res.json(fetchedUC);
    } catch (error) {
        res.json("Purge Operations Failed")
    }
};
