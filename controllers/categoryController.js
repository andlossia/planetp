const initController = require('./crud/initController');

const Category = require('../models/categoryModel');

const categoryController = initController(Category, 'Category', [], [], ['']);

module.exports = categoryController