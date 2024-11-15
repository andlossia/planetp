const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const CertificateSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    participant: { type: Schema.Types.ObjectId, ref: 'User' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  
}, {
    timestamps: true,
});

applyToJSON(CertificateSchema);
module.exports = mongoose.model('Certificate', CertificateSchema);