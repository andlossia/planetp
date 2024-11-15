const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');


const courseSchema = new Schema({
    title: {type: String},
    description: {type: String},
    level: {type: String},
    duration: {type: String},
    language: {type: String },
    slug: {type: String, unique: true },
    cost: {type: Number,},
    status: {type: String, enum: ['draft', 'published', 'archived'], default: 'draft'},
    tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    categories: [{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}],
    instructor: {type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{type: Schema.Types.ObjectId, ref: 'User'}],
    thumbnail: {type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    sections: [{type: Schema.Types.ObjectId, ref: 'Section'}],
    reviews: [{type: Schema.Types.ObjectId, ref: 'Review'}],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    prerequisites: [{type: Schema.Types.ObjectId, ref: 'Course'}],
}, {
    timestamps: true,
});

applyToJSON(courseSchema);
courseSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
