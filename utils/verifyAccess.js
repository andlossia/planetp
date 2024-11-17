const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');

const verifyAccessToVideo = async (userId, courseId, lessonId) => {
    try {
        // Fetch the course and check its existence
        const course = await Course.findById(courseId).populate('participants');
        if (!course) {
            console.error('Course not found');
            return false;
        }

        // Check if the user is an instructor or a participant
        const isInstructor = course.instructor.toString() === userId;
        const isParticipant = course.participants.some(participant => participant.toString() === userId);

        if (!isInstructor && !isParticipant) {
            console.warn('User does not have access to the course');
            return false;
        }

        // Check if the lesson belongs to the course
        const lesson = await Lesson.findById(lessonId);
        if (!lesson || lesson.course.toString() !== courseId) {
            console.error('Lesson not found or does not belong to the course');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verifying access to video:', error);
        return false;
    }
};

module.exports = verifyAccessToVideo;
