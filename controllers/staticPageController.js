const initController = require('./crud/initController');

const StaticPage = require('../models/staticPageModel');

const staticPageController = initController(StaticPage, 'StaticPage', [], [], ['']);

module.exports = staticPageController;