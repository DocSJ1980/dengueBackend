import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const spotSchema = new Schema({
    dsNo: { type: String, required: true },
    occupantName: { type: String, required: true },
    occupantContact: { type: String, required: true },
    storeys: { type: Number, required: true },
    spotFrontImg: { type: String, required: true },
    timeReqForVisit: { type: Number, required: true },
    spotType: { type: String, required: true },
    larvicidingRequired: {
        type: String,
        enum: ['Yes', 'No'],
        required: true
    }

},
    { timestamps: true })

const Spot = mongoose.model("spot", spotSchema);
export default Spot;

