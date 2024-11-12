const initController = require('./crud/initController');
const Article = require('../models/articleModel');

const articleController = initController(Article, 'Article', [], [], ['']);

module.exports = articleController