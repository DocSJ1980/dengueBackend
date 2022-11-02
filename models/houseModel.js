import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const houseSchema = new Schema({
    dhNo: { type: String, required: true },
    residentName: { type: String, required: true },
    residentContact: { type: String, required: true },
    storeys: { type: Number, required: true },
    houseFrontImg: { type: String, required: true },
    houseHolds: [{
        children: [{
            age: {
                type: Number,
                required: true
            },
            gender: {
                type: String,
                enum: ['Male', 'Female'],
                required: true
            },
            dob: {
                type: Date,
                required: true,
            }
        }],
        adults: [{
            age: {
                type: Number,
                required: true
            },
            gender: {
                type: String,
                enum: ['Male', 'Female'],
                required: true
            },
            dob: {
                type: Date,
                required: true,
            }
        }],
    }],
},
    { timestamps: true })

const House = mongoose.model("house", houseSchema);
export default House;

