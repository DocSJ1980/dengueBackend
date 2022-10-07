import multer from 'multer'
import fs from 'fs'
import path from 'path'
import ErrorResponse from './Error.js'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync("public")) {
            fs.mkdirSync("public")
        }
        if (!fs.existsSync("public/csv")) {
            fs.mkdirSync("public/csv")
        }
        cb(null, "public/csv")
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})

export const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname)
        if (ext !== ".csv") {
            return cb(new ErrorResponse("Only CSV Files accepted", 400))
        }
        cb(null, true)
    }
})