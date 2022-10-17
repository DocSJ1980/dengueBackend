import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const spotSchema = new Schema({
    dsNo: { type: String, required: true },
    occupantName: { type: String, required: true },
    occupantContact: { type: String, required: true },
},
    { timestamps: true })

const Spot = mongoose.model("spot", spotSchema);
export default Spot;

