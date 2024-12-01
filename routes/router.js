const express = require('express');
const createCrudRoutes = require('./crudRoutes');
const { validatePaymentRequest } = require('../middlewares/validatePaymentRequest');
const { authenticate } = require('../middlewares/authenticationMiddleware');
const { processPayment } = require('../controllers/crud/custom/paymentMethod');

const router = express.Router();

const authRoutes = require('./authRoute');
const articleController = require('../controllers/articleController');
const breedController = require('../controllers/breedController');
const categoryController = require('../controllers/categoryController');
const certificateController = require('../controllers/certificateController');
const commentController = require('../controllers/commentController');
const courseController = require('../controllers/courseController');
const dogController = require('../controllers/dogController');
const lessonController = require('../controllers/lessonController');
const massageController = require('../controllers/massageController');
const mediaController = require('../controllers/mediaController');
const quizController = require('../controllers/quizController');
const reviewController = require('../controllers/reviewController');
const sectionController = require('../controllers/sectionController');
const staticPageController = require('../controllers/staticPageController');
const tagController = require('../controllers/tagController');
const userController = require('../controllers/userController');


router.use('/', authRoutes);
router.use('/articles', createCrudRoutes(articleController));
router.use('/breeds', createCrudRoutes(breedController));
router.use('/categories', createCrudRoutes(categoryController));
router.use('/certificates', createCrudRoutes(certificateController));
router.use('/comments', createCrudRoutes(commentController));
router.use('/courses', createCrudRoutes(courseController));
router.use('/dogs', createCrudRoutes(dogController));
router.use('/lessons', createCrudRoutes(lessonController));
router.use('/massages', createCrudRoutes(massageController));
router.use('/media', createCrudRoutes(mediaController));
router.use('/quizzes', createCrudRoutes(quizController));
router.use('/reviews', createCrudRoutes(reviewController));
router.use('/sections', createCrudRoutes(sectionController));
router.use('/static-pages', createCrudRoutes(staticPageController));
router.use('/tags', createCrudRoutes(tagController));
router.use('/users', createCrudRoutes(userController));

router.post('/send-massage', massageController.sendMassage);
router.post('/process-payment', validatePaymentRequest, authenticate, processPayment);


module.exports = router;
