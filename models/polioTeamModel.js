import mongoose, { Schema, model } from "mongoose";

const aicSchema = new Schema({
    aicNumber: { type: String, required: true },
    polioTeams: {
        mobilePolioTeams: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        }],
        fixedPolioTeams: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        }],
        transitPolioTeams: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        }]
    }
},
    { timestamps: true })

export const Aic = mongoose.model("aic", aicSchema);

const polioTeamSchema = new Schema({
    teamNo: {
        type: Number,
        required: true
    },
    teamType: {
        type: String,
        enum: ['Mobile', 'Fixed', 'Transit'],
        required: true
    },
    polioDays: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PolioDay'
    }]
},
    { timestamps: true })

polioTeamSchema.path('polioDays').validate(function (value) {
    if (value.length > 5) {
        throw new Error("Only 5 Polio Days can be assigned to a polio team!");
    }
})


export const PolioTeam = mongoose.model("polioTeam", polioTeamSchema);

const polioDay = new Schema({
    dayNo: { type: "Number", required: true },
    area: { type: String, minimumLength: 100 },
    startingImg: { type: String },
    endingImg: { type: String },
    wayPointImgs: [{ type: String }],
    assignedDengueTeam: {
        currentIndoorDT: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DengueTeam'
        },
        pastIndoorDTs: [{
            oldIndoorDTs: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'DengueTeam'
            },
            changeDate: { type: Date, default: Date.now }
        }],
        currentOutdoorDT: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DengueTeam'
        },
        pastOutdoorDTs: [{
            oldOutdoorDTs: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'DengueTeam'
            },
            changeDate: { type: Date, default: Date.now }
        }]

    },
    street: [{
        address: { type: String, required: true },
        house: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'House'
        }],
        spot: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Spot'
        }]
    }]
},
    { timestamps: true })


export const PolioDay = mongoose.model("polioDay", polioDay);

