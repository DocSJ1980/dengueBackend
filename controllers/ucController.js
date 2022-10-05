// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import UC from "../models/ucModel.js"
import ErrorResponse from "../utils/Error.js"

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
