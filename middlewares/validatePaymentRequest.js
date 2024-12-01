const validatePaymentRequest = (req, res, next) => {
    const {
        course,
        expire_month,
        expire_year,
        cvv,
        card_holder_id,
        card_number,
    } = req.body;

    // Validate course ID
    if (!course || typeof course !== "string" || course.trim() === "") {
        return res.status(400).json({ message: "Invalid or missing course ID." });
    }

    // Validate expire_month: must be between 1 and 12
    if (!Number.isInteger(expire_month) || expire_month < 1 || expire_month > 12) {
        return res.status(400).json({ message: "Invalid expire_month." });
    }

    // Validate expire_year: must be current year or within 20 years
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(expire_year) || expire_year < currentYear || expire_year > currentYear + 20) {
        return res.status(400).json({ message: "Invalid expire_year." });
    }

    // Validate CVV: must be a valid 3-4 digit string
    if (!cvv || !/^\d{3,4}$/.test(cvv.toString())) {
        return res.status(400).json({ message: "Invalid CVV." });
    }

    // Validate card_holder_id: must be a valid 9-digit number
    if (!card_holder_id || !/^\d{9}$/.test(card_holder_id.toString())) {
        return res.status(400).json({ message: "Invalid card_holder_id." });
    }

    // Validate card_number: must be a valid 8-19 digit number
    if (!card_number || !/^\d{8,19}$/.test(card_number.toString())) {
        return res.status(400).json({ message: "Invalid card_number." });
    }

    next();
};

module.exports = {
    validatePaymentRequest,
};
