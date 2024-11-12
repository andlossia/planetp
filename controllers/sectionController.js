const initController = require('./crud/initController');
const Section = require('../models/sectionModel');

const sectionController = initController(Section, 'Section', [], [], ['']);

module.exports = sectionController