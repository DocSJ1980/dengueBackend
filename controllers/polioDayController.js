// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import { PolioDay, Street } from "../models/polioTeamModel.js"
import ErrorResponse from "../utils/Error.js"
import fs from 'fs'
import path from 'path'
import csv from 'fast-csv';

//. FIRST ROUTE: Add details to Dengue Day
export const fillPolioDay = async (req, res, next) => {
    try {
        const polioDay = await PolioDay.find({}, {}, {});
        res.json(fetchedTown);
    } catch (error) {
        res.json("No Town Found")
    }
};
