// Declaring consts
import { Strategy, ExtractJwt } from "passport-jwt";
// const JwtStrategy = require('passport-jwt').Strategy;
// const ExtractJwt = require('passport-jwt').ExtractJwt;
import User from '../models/userModel.js'
import ErrorResponse from "../utils/Error.js"

export const passportAuthenticate = (passport) => {
    passport.use(
        new Strategy({
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        },
            function (jwt_payload, next) {
                // console.log(jwt_payload);
                User.findOne({ _id: jwt_payload.id }, function (err, user) {
                    if (err) {
                        return next(new ErrorResponse("No such user exit in our database", 400))
                    }

                    if (user) {
                        return next(null, user)
                    }
                    else {
                        return next(null, false)
                    }
                })
            }
        )
    )
}