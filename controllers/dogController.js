const initController = require('./crud/initController');
const Dog = require('../models/dogModel');

const dogController = initController(Dog, 'Dog', [], [], ['']);

module.exports = dogController