import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const houseSchema = new Schema({
    dhNo: { type: String, required: true },
    residentName: { type: String, required: true },
    residentContact: { type: String, required: true },
},
    { timestamps: true })

const House = mongoose.model("house", houseSchema);
export default House;

