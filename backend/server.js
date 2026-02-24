require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const Team = require('./models/Team');
const Question = require('./models/Question');
const QuizState = require('./models/QuizState');
const Submission = require('./models/Submission');

const demoQuestions = require('./utils/questions');
const { calculateScores } = require('./utils/scoring');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/synergysquad-quiz';

// Database Connection & Seeding
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Seed Questions
        const count = await Question.countDocuments();
        if (count === 0) {
            await Question.insertMany(demoQuestions);
            console.log('Demo questions seeded');
        }

        // Seed Teams and forcibly update them with new names
        const teamsList = [
            { teamId: 'A', name: 'AttackOnTitans' },
            { teamId: 'B', name: 'AlgoLooms' },
            { teamId: 'C', name: 'Moonshine Coders' },
            { teamId: 'D', name: 'CrossCity Coders' }
        ];

        await Team.deleteMany({});
        await Team.insertMany(teamsList);
        console.log('Teams seeded');

        // Initialize Global State and forcibly reset to Waiting lobby on boot
        let state = await QuizState.findOne({ stateId: 'global' });
        if (!state) {
            state = new QuizState({ stateId: 'global' });
        }
        state.status = 'waiting';
        state.currentQuestionIndex = -1;
        state.acceptingAnswers = false;
        state.questionStartTime = null;
        await state.save();

        // Wipe volatile data on boot for a fresh session
        await Submission.deleteMany({});

        console.log('Quiz state initialized to Waiting Lobby');
    })
    .catch(err => console.error('MongoDB connection error:', err));


// Helper to get full state to broadcast
const getFullState = async () => {
    const currentState = await QuizState.findOne({ stateId: 'global' });
    const teams = await Team.find().sort({ teamId: 1 });

    let currentQuestion = null;
    let submissions = [];
    let remainingTime = 0;

    if (currentState && currentState.currentQuestionIndex >= 0) {
        currentQuestion = await Question.findOne({ questionId: currentState.currentQuestionIndex + 1 });
        submissions = await Submission.find({ questionIndex: currentState.currentQuestionIndex });

        if (currentState.status === 'active' && currentState.questionStartTime) {
            const elapsed = Math.floor((Date.now() - new Date(currentState.questionStartTime)) / 1000);
            remainingTime = Math.max(0, 60 - elapsed);
        }
    }

    return {
        state: currentState || { status: 'waiting', currentQuestionIndex: -1 },
        question: currentQuestion,
        teams: teams,
        submissions: submissions,
        remainingTime: remainingTime
    };
};

// --- Socket.IO Handlers ---

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state on connection
    getFullState().then(data => {
        socket.emit('server:state_update', data);
    }).catch(err => console.error("Error fetching state on connect:", err));

    const startQuestionTimer = (questionIndex) => {
        setTimeout(async () => {
            const current = await QuizState.findOne({ stateId: 'global' });
            if (current && current.status === 'active' && current.acceptingAnswers && current.currentQuestionIndex === questionIndex) {
                await QuizState.findOneAndUpdate({ stateId: 'global' }, { acceptingAnswers: false });
                const stateData = await getFullState();
                io.emit('server:state_update', stateData);
            }
        }, 60000);
    };

    socket.on('host:start_quiz', async () => {
        // Reset everything
        await Team.updateMany({}, { score: 0 });
        await Submission.deleteMany({});

        await QuizState.findOneAndUpdate(
            { stateId: 'global' },
            {
                status: 'active',
                currentQuestionIndex: 0,
                acceptingAnswers: true,
                questionStartTime: new Date()
            }
        );

        const data = await getFullState();
        io.emit('server:state_update', data);
        io.emit('server:timer_sync', 60); // 60 seconds timer
        startQuestionTimer(0);
    });

    socket.on('host:restart_quiz', async () => {
        // Clear all submissions and reset team scores
        await Team.updateMany({}, { score: 0 });
        await Submission.deleteMany({});

        // Set global state back to waiting
        await QuizState.findOneAndUpdate(
            { stateId: 'global' },
            {
                status: 'waiting',
                currentQuestionIndex: -1,
                acceptingAnswers: false,
                questionStartTime: null
            }
        );

        const data = await getFullState();
        io.emit('server:state_update', data);
        io.emit('server:timer_sync', 0);
        io.emit('server:toast', { message: 'Quiz Reset to Lobby', type: 'info' });
    });

    socket.on('host:next_question', async () => {
        const currentState = await QuizState.findOne({ stateId: 'global' });
        const nextIndex = currentState.currentQuestionIndex + 1;

        await QuizState.findOneAndUpdate(
            { stateId: 'global' },
            {
                status: 'active',
                currentQuestionIndex: nextIndex,
                acceptingAnswers: true,
                questionStartTime: new Date()
            }
        );

        const data = await getFullState();
        io.emit('server:state_update', data);
        io.emit('server:timer_sync', 60);
        startQuestionTimer(nextIndex);
    });

    socket.on('host:reveal_answer', async () => {
        const currentState = await QuizState.findOne({ stateId: 'global' });
        if (currentState.status !== 'active') return;

        // Stop accepting answers
        await QuizState.findOneAndUpdate(
            { stateId: 'global' },
            { acceptingAnswers: false, status: 'revealed' }
        );

        // Get current question and submissions
        const question = await Question.findOne({ questionId: currentState.currentQuestionIndex + 1 });
        let submissions = await Submission.find({ questionIndex: currentState.currentQuestionIndex });

        // Handle skipped teams
        const allTeams = ['A', 'B', 'C', 'D'];
        const submittedTeamIds = submissions.map(s => s.teamId);

        for (const tid of allTeams) {
            if (!submittedTeamIds.includes(tid)) {
                const skipSub = new Submission({
                    teamId: tid,
                    questionIndex: currentState.currentQuestionIndex,
                    answer: null,
                    lockedAt: new Date(),
                    isCorrect: false,
                    skipped: true
                });
                await skipSub.save();
                submissions.push(skipSub);
            }
        }

        // Identify correct answers before passing to calculateScores
        submissions = submissions.map(sub => {
            if (!sub.skipped && sub.answer === question.correctAnswer) {
                sub.isCorrect = true;
            }
            return sub;
        });

        // Score calculations
        const scoredSubmissions = calculateScores(submissions);

        // Save points awarded and update team scores
        for (const sub of scoredSubmissions) {
            await Submission.findByIdAndUpdate(sub._id, {
                isCorrect: sub.isCorrect,
                pointsAwarded: sub.pointsAwarded,
                order: sub.order,
                skipped: sub.skipped
            });

            await Team.findOneAndUpdate(
                { teamId: sub.teamId },
                { $inc: { score: sub.pointsAwarded } }
            );
        }

        const finalData = await getFullState();
        io.emit('server:state_update', finalData);
        io.emit('server:toast', { message: 'Answers Revealed!', type: 'info' });
    });

    socket.on('team:lock_answer', async (data) => {
        // data: { teamId: 'A', answer: 'Hyper Text...' }
        const { teamId, answer } = data;
        const currentState = await QuizState.findOne({ stateId: 'global' });

        if (!currentState.acceptingAnswers) return;

        // Check if team already submitted
        const existing = await Submission.findOne({
            teamId,
            questionIndex: currentState.currentQuestionIndex
        });

        if (existing) return; // Prevent multiple locks

        const sub = new Submission({
            teamId,
            questionIndex: currentState.currentQuestionIndex,
            answer,
            lockedAt: new Date()
        });

        await sub.save();

        // Broadcast only the lock status to everyone so the host can see it live
        const stateData = await getFullState();
        io.emit('server:state_update', stateData);
    });

    // End accepting answers (usually called by timer on host)
    socket.on('host:time_up', async () => {
        await QuizState.findOneAndUpdate(
            { stateId: 'global' },
            { acceptingAnswers: false } // Status remains active until reveal is clicked
        );
        const stateData = await getFullState();
        io.emit('server:state_update', stateData);
    });

    // Manual score adjustment
    socket.on('host:update_score', async ({ teamId, delta }) => {
        await Team.findOneAndUpdate(
            { teamId },
            { $inc: { score: delta } }
        );
        const stateData = await getFullState();
        io.emit('server:state_update', stateData);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    const uri = process.env.MONGO_URI || '';
    res.json({
        status: 'online',
        mongodb_state: mongoose.connection.readyState,
        has_mongo_uri: !!process.env.MONGO_URI,
        uri_length: uri.length,
        uri_start: uri.substring(0, 10),
        uri_end: uri.substring(uri.length - 5)
    });
});

// Serve Frontend Configuration for Production Deployment
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get(['/', '/host', '/team/:id'], (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
