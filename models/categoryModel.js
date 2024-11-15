const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const categorySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String},
    slug: { type: String},
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    timestamps: true,
});

applyToJSON(categorySchema);

module.exports = mongoose.model('Category', categorySchema);