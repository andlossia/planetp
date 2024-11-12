const initController = require('./crud/initController');
const Certificate = require('../models/certificateModel');

const certificateController = initController(Certificate, 'Certificate', [], [], ['']);

module.exports = certificateController