// Imports
import express from "express";
import { config } from "dotenv";
import userRouter from "./routes/user.js"
import simplesRouter from "./routes/simplesRoutes.js"
import errorHandler from "./middleware/errorHandler.js";
import { connectDB } from "./config/database.js"
import passport from "passport"
import cookieParser from "cookie-parser"

// Declaring Path for dotenv
config({
    path: "./config/config.env"
})

// Declaring consts and initializing express
const app = express()
const port = process.env.PORT
const URI = process.env.URI

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Using routes
app.use("/user", userRouter)
app.use("/simples", simplesRouter)

// Connecting Database
connectDB(URI)

// Running the server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})


// Initialize passport
app.use(passport.initialize());

// Using custom error handler
app.use(errorHandler)