const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const lessondSchema = new Schema({
    title: { type: String, },
    description: { type: String, },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
    contentType: { type: String, enum: ['text', 'video', 'quiz'], default: 'text' },
    content: { type: String, },
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    quiz: [{
        question: { type: String, },
        options: [{ type: String, }],
        correctAnswer: { type: String, },
    }],
    isLocked: { type: Boolean, default: false },
    duration: { type: String, },
    lessonType: { type: String, enum: ['free', 'paid'], default: 'paid' },
    tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    thumbnail: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, {
    timestamps: true,
});

applyToJSON(lessondSchema);
lessondSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessondSchema);