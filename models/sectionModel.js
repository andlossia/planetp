const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const sectionSchema = new Schema({
    title: { type: String},
    description: { type: String},
    slug: { type: String,unique: true },
    order: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    thumbnail: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    timestamps: true,
});

applyToJSON(sectionSchema);
sectionSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);