const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const DogSchema = new Schema({
    breed: { type: Schema.Types.ObjectId, ref: 'Breed', required: true },
    name: { type: String, required: true },
    birthDate: { type: Date },
    favoriteName: { type: String },
    weight: { type: Number },
    height: { type: Number },
    eyeColor: { type: String },
    diet: { type: String },
    training: { type: String },
    healthIssues: { type: String },
    uniqueBehaviors: { type: String }
  }, { timestamps: true });

applyToJSON(DogSchema);

module.exports = mongoose.model('Dog', DogSchema);