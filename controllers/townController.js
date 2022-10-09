// Importing express server, router, middleware i.e. fetchuser, models i.e. Notes and express validator
import Town from "../models/townModel.js"
import ErrorResponse from "../utils/Error.js"
import fs from 'fs'
import path from 'path'
import csv from 'fast-csv';
import { Url } from "url";
const __dirname = new Url('.', import.meta.url).pathname

//FIRST ROUTE: Get all the simple activities
export const fetchAllTowns = async (req, res, next) => {
    try {
        const fetchedTown = await Town.find({}, {}, {});
        res.json(fetchedTown);
    } catch (error) {
        res.json("No Town Found")
    }
};

//SECOND ROUTE: Batch create Towns with CSV file
export const batchTown = async (req, res, next) => {
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
                    const insertedTowns = Town.insertMany(allRecords)
                    return res.status(200).json(`${rowCount} Towns have been inserted`)
                } catch (error) {
                    return res.status(404).json("Could not be insted in database")
                }
            }
            );
    } catch (error) {
        return next(new ErrorResponse("Failed to batch create Towns", 400))
    }
}