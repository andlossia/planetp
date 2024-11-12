const initController = require('./crud/initController');
const Review = require('../models/reviewModel');

const reviewController = initController(Review, 'Review', [], [], ['']);

module.exports = reviewController