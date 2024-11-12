const initController = require('./crud/initController');

const Course = require('../models/courseModel');

const courseController = initController(Course, 'Course', [], [], ['']);

module.exports = courseController