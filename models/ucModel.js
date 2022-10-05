import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const ucSchema = new Schema({
  town: { type: String },
  ucSort: { type: Number },
  trackingUC: { type: String },
  survUC: { type: String },
  pop2021: { type: Number },
  pop2022: { type: Number },
  ucType: { type: String },
  houses: { type: Number },
  spots: { type: Number },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  townEnto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ddho: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
},
  { timestamps: true });

const UC = mongoose.model("uc", ucSchema);
export default UC;