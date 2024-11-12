const initController = require('./crud/initController');
const Breed = require('../models/breedModel');

const breedController = initController(Breed, 'Breed', [], [], ['']);

module.exports = breedController;