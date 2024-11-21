const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quizSchema = new Schema({
    title: { type: String,  },
    description: { type: String },
    slug: { type: String, unique: true },
    
    questions: [{
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: String }
      }],
    trials: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  },
        attempts: [{
            attemptNumber: { type: Number,  },
            answers: [{
                questionIndex: { type: Number,  }, 
                selectedOption: { type: String,  }, 
                isCorrect: { type: Boolean,  }
            }],
            score: { type: Number,  },
            timeTaken: { type: Number }
        }]
    }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  }, 
}, {
    timestamps: true,
});


module.exports = mongoose.model('Quiz', quizSchema);
