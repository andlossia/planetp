const mongoose = require('mongoose');
const { makeTranzilaRequest } = require('../../../services/payment/tranzila');
const Course = require('../../../models/courseModel');

const processPayment = async (req, res) => {
    try {
        const courseId = req.body.course || req.body._id || req.params._id;

        // Convert to ObjectId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID format.' });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: `Course not found: ${courseId}` });
        }

        if (course.status !== 'published') {
            return res.status(400).json({ message: 'Cannot purchase unpublished courses.' });
        }

        if (!course.cost || course.cost <= 0) {
            return res.status(400).json({ message: 'Invalid course cost.' });
        }

        // Payment processing logic...
        const { paymentDetails } = req.body;

        const payload = {
            terminal_name: process.env.TRANZILA_TERMINAL_NAME || 'myterminal',
            amount: course.cost,
            currency: 'ILS',
            description: `Payment for course: ${course.title}`,
            paymentDetails,
        };

        const response = await makeTranzilaRequest(payload);

        if (response.status === 'success') {
            if (!course.participants.includes(req.user._id)) {
                course.participants.push(req.user._id);
                await course.save();
            }

            return res.status(200).json({
                message: 'Payment successful. You have been enrolled in the course.',
                data: response,
            });
        } else {
            return res.status(400).json({
                message: 'Payment failed',
                error: response.error || 'Unknown error from payment gateway.',
            });
        }
    } catch (error) {
        console.error('Payment processing error:', error.message);
        return res.status(500).json({
            message: 'Payment processing failed',
            error: error.message,
        });
    }
};
module.exports = {
    processPayment
};
