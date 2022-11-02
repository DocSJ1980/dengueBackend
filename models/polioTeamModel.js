import mongoose, { Schema, model } from "mongoose";

const aicSchema = new Schema({
    polioTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }]
},
    { timestamps: true })

const Aic = mongoose.model("aic", aicSchema);
module.exports = Aic;


import mongoose, { Schema, model } from "mongoose";

const polioTeamSchema = new Schema({
    teamNo: {
        type: Number
    },
    teamType: {
        type: String,
        enum: ['Mobile', 'Fixed', 'Roaming'],
        required: true
    },
    polioDays: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PolioDay'
    }]
},
    { timestamps: true })

polioTeamSchema.path('polioDays').validate(function (value) {
    console.log(value.length)
    if (value.length > 5) {
        throw new Error("Only 5 Polio Days can be assigned to a polio team!");
    }
})


const PolioTeam = mongoose.model("polioTeam", polioTeamSchema);
module.exports = PolioTeam;

const polioDay = new Schema({
    area: { type: String, required: true, minimumLength: 100 },
    startingImg: { type: String },
    endingImg: { type: String },
    wayPointImgs: [{ type: String }],
    assignedDengueTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'House'
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


const PolioDay = mongoose.model("polioDay", polioDay);
module.exports = PolioDay;

