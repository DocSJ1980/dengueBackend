import { Aic, PolioDay, PolioTeam, Street } from "../models/polioTeamModel.js"
import UC from "../models/ucModel.js"
let foundUC, foundAic, foundPolioTeam, foundPolioDay, foundStreet

export const getData = async (id) => {
    console.log("get data function called", id)
    foundStreet = await Street.findById(id)
    if (!foundStreet) {
        console.log("IF-1 reached")
        foundPolioDay = await PolioDay.findById(id)
        if (!foundPolioDay) {
            console.log("IF-2 reached")
            foundPolioTeam = await PolioTeam.findById(id)
            if (!foundPolioTeam) {
                console.log("IF-3 reached")
                foundAic = await Aic.findById(id)
                if (!foundAic) {
                    console.log("IF-4 reached")
                    foundUC = await UC.findById(id)
                    if (!foundUC) {
                        console.log("IF-5 reached")
                        return null
                    } else {
                        console.log("Else-5 reached")
                        return foundUC
                    }
                } else {
                    console.log("Else-4 reached")
                    foundUC = await UC.findOne({ "polioSubUCs.aic": foundAic._id })
                    return foundUC, foundAic
                }
            } else {
                console.log("Else-3 reached")
                foundAic = await Aic.findOne({ "polioTeams.mobilePolioTeams": foundPolioTeam._id })
                foundUC = await UC.findOne({ "polioSubUCs.aic": foundAic._id })
                return foundUC, foundAic, foundPolioTeam
            }
        } else {
            console.log("Else-2 reached")
            foundPolioTeam = await PolioTeam.findOne({ polioDays: foundPolioDay._id })
            foundAic = await Aic.findOne({ "polioTeams.mobilePolioTeams": foundPolioTeam._id })
            foundUC = await UC.findOne({ "polioSubUCs.aic": foundAic._id })
            console.log(foundUC.survUC, foundAic.aicNumber, foundPolioTeam.teamNo, foundPolioDay.dayNo)
            return { foundUC, foundAic, foundPolioTeam, foundPolioDay }
        }
    } else {
        console.log("Else-1 reached")
        foundPolioDay = await PolioDay.findOne({ street: foundStreet._id })
        foundPolioTeam = await PolioTeam.findOne({ polioDays: foundPolioDay._id })
        foundAic = await Aic.findOne({ "polioTeams.mobilePolioTeams": foundPolioTeam._id })
        foundUC = await UC.findOne({ "polioSubUCs.aic": foundAic._id })
        return { foundUC, foundAic, foundPolioTeam, foundPolioDay, foundStreet }
    }
}