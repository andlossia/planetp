const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applyToJSON = require('../middlewares/applyToJson');

const articleSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [20, 'Description must be at least 20 characters long'],
        maxlength: [100000, 'Description cannot exceed 100000 characters']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        minlength: [3, 'Slug must be at least 3 characters long'],
        maxlength: [100, 'Slug cannot exceed 100 characters'],
        validate: {
            validator: function (v) {
                return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v); 
            },
            message: props => `${props.value} is not a valid slug!`
        }
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    likes: {
        type: Number,
        default: 0, 
        min: [0, 'Likes cannot be negative'] 
    },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
}, {
    timestamps: true,
});

applyToJSON(articleSchema);

articleSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Article', articleSchema);
