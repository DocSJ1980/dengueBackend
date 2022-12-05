import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const spotSchema = new Schema({
    dsNo: { type: String, required: true },
    occupantName: { type: String, required: true },
    occupantContact: { type: String, required: true },
    storeys: { type: Number, required: true },
    spotFrontImg: { type: String },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    timeReqForVisit: { type: Number, required: true },
    spotType: { type: String, required: true },
    larvicidingRequired: {
        type: String,
        enum: ['Yes', 'No'],
    },
    lastUpdated: [{
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedOn: { type: Date, default: Date.now }
    }]
},
    { timestamps: true })

export const Spot = mongoose.model("spot", spotSchema);

const houseSchema = new Schema({
    dhNo: { type: String, required: true },
    polioHouseNo: { type: String, required: true },
    storeys: { type: Number, required: true },
    houseFrontImg: {
        type: String,
        // required: true
    },
    houseHolds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HouseHold'
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdated: [{
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedOn: { type: Date, default: Date.now }
    }]
},
    { timestamps: true })

export const House = mongoose.model("house", houseSchema);

const houseHoldSchema = new Schema({
    residentName: { type: String, required: true },
    residentContact: { type: String, required: true },
    residentType: { type: String, required: true, enum: ['Owner', 'Tenant'] },
    persons: [{
        age: {
            type: Number,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female'],
        },
        dob: {
            type: Date,
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdated: [{
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedOn: { type: Date, default: Date.now }
    }]

},
    { timestamps: true })

export const HouseHold = mongoose.model("houseHold", houseHoldSchema);
