const initController = require('./crud/initController');

const Tag = require('../models/tagModel');

const tagController = initController(Tag, 'Tag', [], [], ['']);

module.exports = tagController