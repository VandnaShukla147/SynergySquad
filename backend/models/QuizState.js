const mongoose = require('mongoose');

const quizStateSchema = new mongoose.Schema({
    stateId: { type: String, default: 'global', unique: true },
    status: { type: String, enum: ['waiting', 'active', 'revealed', 'finished', 'reviewing'], default: 'waiting' },
    currentQuestionIndex: { type: Number, default: -1 },
    questionStartTime: { type: Date },
    acceptingAnswers: { type: Boolean, default: false }
});

module.exports = mongoose.model('QuizState', quizStateSchema);
