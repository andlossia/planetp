const initController = require('./crud/initController');
const Quiz = require('../models/quizModel');

const quizController = initController(Quiz, 'Quiz', [], [], ['']);

module.exports = quizController;