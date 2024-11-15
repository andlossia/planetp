const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const ReviewSchema = new Schema({
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    timestamps: true,
});

applyToJSON(ReviewSchema);

module.exports = mongoose.model('Review', ReviewSchema)