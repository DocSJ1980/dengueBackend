import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const ucSchema = new Schema({
  town: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town'
  },
  ucSort: { type: Number },
  trackingUC: { type: String },
  survUC: { type: String },
  pop2021: { type: Number },
  pop2022: { type: Number },
  ucType: { type: String },
  houses: { type: Number },
  spots: { type: Number },
  supervisor: {
    currentSuper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pastSuper:
      [{
        oldSuper: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changeDate: { type: Date, default: Date.now }
      }]
  },
  ento: {
    currentEnto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pastEntos:
      [{
        oldEnto: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changeDate: { type: Date, default: Date.now }
      }]
  },
  townEnto: {
    currentTownEnto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pastTownEnto:
      [{
        oldSuper: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changeDate: { type: Date, default: Date.now }
      }]
  },
  ddho: {
    currentDdho: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pastDdho:
      [{
        oldSuper: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changeDate: { type: Date, default: Date.now }
      }]
  },
  currentMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  indoorTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DengueTeam'
  }],
  outdoorTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DengueTeam'
  }],
  polioSubUCs: {
    aic: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aic'
    }]
  }

},
  { timestamps: true });

const UC = mongoose.model("uc", ucSchema)
export default UC