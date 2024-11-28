const { body, validationResult } = require('express-validator');

const validatePaymentRequest = [
    body('course').isMongoId().withMessage('Invalid course ID'),
    body('paymentDetails.card_holder_name').isLength({ min: 3 }).withMessage('Invalid card holder name'),
    body('paymentDetails.card_holder_id').isLength({ min: 7, max: 9 }).withMessage('Invalid customer ID'),
    body('paymentDetails.card_number').isCreditCard().withMessage('Invalid card number'),
    body('paymentDetails.expire_month').isLength({ min: 2, max: 2 }).withMessage('Invalid expiration month'),
    body('paymentDetails.expire_year').isLength({ min: 4, max: 4 }).withMessage('Invalid expiration year'),
    body('paymentDetails.cvv').isLength({ min: 3, max: 4 }).withMessage('Invalid CVV'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validatePaymentRequest
};
