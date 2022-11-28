//. Imports
import express from "express";
import { config } from "dotenv";
import userRouter from "./routes/user.js"
import simplesRouter from "./routes/simplesRoutes.js"
import ucRouter from "./routes/ucRoutes.js"
import townRouter from "./routes/townRoutes.js"
import teamRouter from "./routes/teamRoutes.js"
import polioDayRouter from "./routes/polioDayRoutes.js"
import errorHandler from "./middleware/errorHandler.js";
import { connectDB } from "./config/database.js"
import passport from "passport"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
// import multer from 'multer'

//. Declaring Path for dotenv
config({
    path: "./config/config.env"
})

//. Declaring consts and initializing express
const app = express()
const port = process.env.PORT
const URI = process.env.URI
// const upload = multer()

//. Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(upload.array())
app.use(cookieParser())

//. Using routes
app.use("/user", userRouter)
app.use("/simples", simplesRouter)
app.use("/uc", ucRouter)
app.use("/town", townRouter)
app.use("/teams", teamRouter)
app.use("/polioday", polioDayRouter)
app.use(express.static('images'))

//. Connecting Database
connectDB(URI)

//. Running the server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})


//. Initialize passport
app.use(passport.initialize());

//. Using custom error handler
app.use(errorHandler)