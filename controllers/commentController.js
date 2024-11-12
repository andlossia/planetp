const initController = require('./crud/initController');
const Comment = require('../models/commentModel');

const commentController = initController(Comment, 'Comment', [], [], ['']);

module.exports = commentController;