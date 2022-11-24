import fs from 'fs'

export const filePath = async (foundUC, foundAic, foundPolioTeam, foundPolioDay, street, imgType) => {
    if (street) {
        if (!fs.existsSync("images")) {
            fs.mkdirSync("images")
        }
        if (!fs.existsSync("images/" + foundUC.survUC)) {
            fs.mkdirSync("images/" + foundUC.survUC)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/Street: " + street.address)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/Street: " + street.address)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/Street: " + street.address + "/" + imgType)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/Street: " + street.address + "/" + imgType)
        }
        return "images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/Street: " + street.address + "/" + imgType + "/"
    }

    if (!street) {
        if (!fs.existsSync("images")) {
            fs.mkdirSync("images")
        }
        if (!fs.existsSync("images/" + foundUC.survUC)) {
            fs.mkdirSync("images/" + foundUC.survUC)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo)
        }
        if (!fs.existsSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/" + imgType)) {
            fs.mkdirSync("images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/" + imgType)
        }
        return "images/" + foundUC.survUC + "/Area_Incharge-" + foundAic.aicNumber + "/polioTeam-" + foundPolioTeam.teamNo + "/polioDay-" + foundPolioDay.dayNo + "/" + imgType + "/"
    }
}