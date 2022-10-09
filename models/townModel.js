import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const townSchema = new Schema({
  townName: { type: String },
  townEnto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ddho: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
},
  { timestamps: true });

const Town = mongoose.model("town", townSchema);
export default Town;