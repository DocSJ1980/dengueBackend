import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const dengueTeamSchema = new Schema({
    teamType: {
        type: String,
        enum: ['Indoor', 'Outdoor'],
        required: true
    },
    currentMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // maxItems: 2
    }],
    pastMembers: [{
        memberDetail: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        dateTransferredIn: { type: Date },
        transferredFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UC'
        },
        dateTransferredOut: { type: Date },
        transferredTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UC'
        },
    }],
},
    { timestamps: true })

dengueTeamSchema.path('currentMembers').validate(function (value) {
    console.log(value.length)
    if (value.length > 2) {
        throw new Error("Only 2 sanitary patrols can be assigned to a team!");
    }
})

const DengueTeam = mongoose.model("dengueTeam", dengueTeamSchema);
export default DengueTeam;

