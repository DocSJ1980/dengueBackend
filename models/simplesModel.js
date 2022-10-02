import mongoose, { Schema, model } from "mongoose";

// Defining Simple Activity Scheme with mongoose
const simpleActivitySchema = new Schema({
  pitbid: { type: Number, unique: true },
  district: { type: String },
  town: { type: String },
  uc: { type: String },
  department: { type: String },
  tag: { type: String },
  larvaFound: { type: String },
  dengueLarva: { type: String },
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
  beforePic: { type: String },
  afterPic: { type: String },
  timeDiff: { type: Number },
  userName: { type: String },
  dateSubmitted: { type: Date },
  bogus: { type: String },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: {
      type: String,
      required: true
    },
  }]

},
  { timestamps: true });

// Declaring and exporting the scheme/model
simpleActivitySchema.index({ location: "2dsphere" })
const SimpleActivity = mongoose.model("simpleActivities", simpleActivitySchema);
export default SimpleActivity;