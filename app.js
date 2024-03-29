//. Imports
import express from "express";
import { config } from "dotenv";
import userRouter from "./routes/user.js";
import simplesRouter from "./routes/simplesRoutes.js";
import ucRouter from "./routes/ucRoutes.js";
import townRouter from "./routes/townRoutes.js";
import teamRouter from "./routes/teamRoutes.js";
import polioDayRouter from "./routes/polioDayRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectDB } from "./config/database.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import https from "https";
import fs from "fs";
// import multer from 'multer';

//. Declaring Path for dotenv
config({
    path: "./config/config.env",
});

//. Declaring consts and initializing express
const app = express();
const port = process.env.PORT;
const URI = process.env.URI;
// const sslServer = https.createServer({
//     key: fs.readFileSync('./config/cert/key.pem'),
//     cert: fs.readFileSync('./config/cert/cert.pem'),
// }, app);

//. Middlewares
app.use(cors({
    credentials: true,
    origin: true,
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

//. Using routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/simples", simplesRouter);
app.use("/api/v1/uc", ucRouter);
app.use("/api/v1/town", townRouter);
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/polioday", polioDayRouter);
// app.use("./*", (req, res) => {
//     res.sendFile(path.join('./', "dist", "index.html"));
// }
// )
// app.use(express.static('dist'))
app.use(express.static('images'));

//. Connecting Database
connectDB(URI);

//. Initialize passport
app.use(passport.initialize());

//. Using custom error handler
app.use(errorHandler);

// Catch-all route for any unhandled routes
app.get("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
});

//. Running http server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

//. Running SSl Server
// sslServer.listen(port, () => {
//     console.log(`SSL Server is running on port: ${port}`)
// });
