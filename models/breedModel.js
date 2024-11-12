const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const applyToJSON = require('../middlewares/applyToJson');

const breedSchema = new Schema({
  breedName: { type: String, required: true }, 
  traits: {
    bodyStructure: { type: String},
    loyalty: { type: String },
    intelligence: { type: String},
    energyLevel: { type: String },
    bravery: { type: String},
    alertness: { type: String },
    senseOfSmell: { type: String },
    coat: { type: String},
    trainability: { type: String},
    size: { type: String }
  }
}, {
  timestamps: true,
});

applyToJSON(breedSchema);
const Breed = mongoose.model('Breed', breedSchema);

module.exports = Breed;
