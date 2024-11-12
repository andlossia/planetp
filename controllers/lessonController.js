const initController = require('./crud/initController');
const Lesson = require('../models/lessonModel');

const lessonController = initController(Lesson, 'Lesson', [], [], ['']);

module.exports = lessonController