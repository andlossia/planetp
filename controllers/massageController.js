const initController = require('./crud/initController');
const sendMassage = require('./crud/custom/sendMethods');
const Massage = require('../models/massageModel');

const massageController = initController(Massage, 'Massage', { sendMassage: sendMassage(Massage) }, [], []);

module.exports = {
    ...massageController,
    sendMassage: sendMassage(Massage)[0]
}