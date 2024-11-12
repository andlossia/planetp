const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const massageSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
}, {
    timestamps: true,
});

applyToJSON(massageSchema);

module.exports = mongoose.model('Massage', massageSchema);