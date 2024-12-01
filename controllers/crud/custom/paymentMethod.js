const mongoose = require('mongoose');
const { makeTranzilaRequest } = require('../../../services/payment/tranzila');
const Course = require('../../../models/courseModel');

// Map error codes to HTTP status and messages
const mapErrorCodeToHttpStatus = (errorCode) => {
    const errorMapping = {
        "20111": { status: 400, message: "Provided token check failure" },
        "20112": { status: 404, message: "Original transaction not found" },
        "21100": { status: 400, message: "Transaction index mismatch" },
        "21101": { status: 400, message: "Provided index was empty" },
        "22101": { status: 400, message: "Empty authorization number" },
        "22100": { status: 400, message: "Authorization number mismatch" },
        "22103": { status: 400, message: "Invalid DCdisable" },
    };

    return errorMapping[errorCode] || { status: 400, message: "Unknown application error" };
};

// Payment processing function
const processPayment = async (req, res) => {
    try {
        const { course: courseId, ...paymentDetails } = req.body;

        // Validate course ID
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            console.error("Invalid Course ID format:", courseId);
            return res.status(400).json({ message: "Invalid Course ID format." });
        }

        // Fetch the course from the database
        const course = await Course.findById(courseId);
        if (!course) {
            console.error(`Course not found: ${courseId}`);
            return res.status(404).json({ message: `Course not found: ${courseId}` });
        }

        // Validate course details
        if (course.status !== "published") {
            console.error(`Attempt to purchase unpublished course: ${courseId}`);
            return res.status(400).json({ message: "Cannot purchase unpublished courses." });
        }
        if (!course.cost || course.cost <= 0) {
            console.error(`Invalid course cost for course: ${courseId}`);
            return res.status(400).json({ message: "Invalid course cost." });
        }

        // Construct the items array based on the course details
        const items = [
            {
                name: course.title,
                type: "C",
                unit_price: course.cost,
                units_number: 1,
            },
        ];

        // Construct the payload for Tranzila
        const payload = {
            terminal_name: process.env.TRANZILA_TERMINAL_NAME,
            expire_month: paymentDetails.expire_month,
            expire_year: paymentDetails.expire_year,
            cvv: paymentDetails.cvv.toString(),
            card_number: paymentDetails.card_number.toString(),
            items: items,
        };


        // Make the payment request to Tranzila
        const response = await makeTranzilaRequest(payload);

   

        // Handle application-level error codes
        if (response.error_code !== 0) {
            const { status, message } = mapErrorCodeToHttpStatus(response.error_code);
            console.error("Application error:", {
                error_code: response.error_code,
                message: response.message || message,
            });
            return res.status(status).json({
                error_code: response.error_code,
                message: response.message || message,
            });
        }

        // Handle successful response (error_code: 0)
        if (response.error_code === 0 && response.transaction_result) {
            // Enroll user in the course
            if (!course.participants.includes(req.user._id)) {
                course.participants.push(req.user._id);
                await course.save();
            }

            console.info("Payment successful:", response);

            return res.status(200).json({
                message: "Payment successful. You have been enrolled in the course.",
                transaction_result: response.transaction_result,
                course: {
                    id: course._id,
                    title: course.title,
                    cost: course.cost,
                },
            });
        }

        // Handle unexpected responses
        console.error("Unexpected error in Tranzila response:", response);
        return res.status(500).json({
            message: "Unexpected error occurred during payment processing.",
            error: response.message || "Unknown error from payment gateway.",
        });
    } catch (error) {
        console.error("Error processing payment:", error.message);
        return res.status(500).json({
            message: "Payment processing failed",
            error: error.message,
        });
    }
};

module.exports = { processPayment };
