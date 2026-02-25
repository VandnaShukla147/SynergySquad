require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

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
    },
    // WebSocket-first for lowest latency; fall back to polling only if needed
    transports: ['websocket', 'polling'],
    // Tuned for 20+ concurrent users — faster heartbeats detect stale connections sooner
    pingInterval: 10000,
    pingTimeout: 5000,
    // Allow larger payloads for image-heavy question data
    maxHttpBufferSize: 1e7,
    // Enable connection state recovery so clients auto-resync after brief disconnects
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
    }
});

const PORT = process.env.PORT || 5000;

// ====== IN-MEMORY DATA STORE ======

// Questions — loaded from file
const questions = [...demoQuestions];

// Teams
let teams = [
    { teamId: 'A', name: 'AttackOnTitans', score: 0 },
    { teamId: 'B', name: 'AlgoLooms', score: 0 },
    { teamId: 'C', name: 'Moonshine Coders', score: 0 },
    { teamId: 'D', name: 'CrossCity Coders', score: 0 }
];

// Quiz state
let quizState = {
    stateId: 'global',
    status: 'waiting',
    currentQuestionIndex: -1,
    acceptingAnswers: false,
    questionStartTime: null
};

// Submissions (array of objects)
let submissions = [];

console.log(`Loaded ${questions.length} questions`);
console.log('Teams initialized');
console.log('Quiz state initialized to Waiting Lobby');


// Helper to get full state to broadcast
const getFullState = () => {
    const totalQuestions = questions.length;

    let currentQuestion = null;
    let currentSubmissions = [];
    let remainingTime = 0;

    if (quizState.currentQuestionIndex >= 0) {
        currentQuestion = questions.find(q => q.questionId === quizState.currentQuestionIndex + 1) || null;
        currentSubmissions = submissions.filter(s => s.questionIndex === quizState.currentQuestionIndex);

        if (quizState.status === 'active' && quizState.questionStartTime) {
            const elapsed = Math.floor((Date.now() - new Date(quizState.questionStartTime)) / 1000);
            remainingTime = Math.max(0, 90 - elapsed);
        }
    }

    return {
        state: { ...quizState },
        question: currentQuestion,
        teams: [...teams].sort((a, b) => a.teamId.localeCompare(b.teamId)),
        submissions: currentSubmissions,
        remainingTime: remainingTime,
        totalQuestions: totalQuestions
    };
};

// --- Socket.IO Handlers ---

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, '| Transport:', socket.conn.transport.name, '| Total:', io.engine.clientsCount);

    // Send initial state on connection
    socket.emit('server:state_update', getFullState());

    const startQuestionTimer = (questionIndex) => {
        setTimeout(() => {
            if (quizState.status === 'active' && quizState.acceptingAnswers && quizState.currentQuestionIndex === questionIndex) {
                quizState.acceptingAnswers = false;
                io.emit('server:state_update', getFullState());
            }
        }, 90000);
    };

    socket.on('host:start_quiz', () => {
        // Reset everything
        teams.forEach(t => t.score = 0);
        submissions = [];

        quizState.status = 'active';
        quizState.currentQuestionIndex = 0;
        quizState.acceptingAnswers = true;
        quizState.questionStartTime = new Date();

        io.emit('server:state_update', getFullState());
        io.emit('server:timer_sync', 90);
        startQuestionTimer(0);
    });

    socket.on('host:restart_quiz', () => {
        teams.forEach(t => t.score = 0);
        submissions = [];

        quizState.status = 'waiting';
        quizState.currentQuestionIndex = -1;
        quizState.acceptingAnswers = false;
        quizState.questionStartTime = null;

        io.emit('server:state_update', getFullState());
        io.emit('server:timer_sync', 0);
        io.emit('server:toast', { message: 'Quiz Reset to Lobby', type: 'info' });
    });

    socket.on('host:next_question', () => {
        const nextIndex = quizState.currentQuestionIndex + 1;
        const totalQuestions = questions.length;

        if (nextIndex >= totalQuestions) {
            quizState.status = 'finished';
            quizState.acceptingAnswers = false;
            quizState.questionStartTime = null;

            io.emit('server:state_update', getFullState());
            io.emit('server:timer_sync', 0);
            io.emit('server:toast', { message: 'Quiz Complete! Start the review to go over answers.', type: 'info' });
            return;
        }

        quizState.status = 'active';
        quizState.currentQuestionIndex = nextIndex;
        quizState.acceptingAnswers = true;
        quizState.questionStartTime = new Date();

        io.emit('server:state_update', getFullState());
        io.emit('server:timer_sync', 90);
        startQuestionTimer(nextIndex);
    });

    socket.on('host:prev_question', () => {
        if (quizState.currentQuestionIndex <= 0) return;
        const prevIndex = quizState.currentQuestionIndex - 1;
        quizState.status = 'revealed';
        quizState.currentQuestionIndex = prevIndex;
        quizState.acceptingAnswers = false;
        quizState.questionStartTime = null;

        io.emit('server:state_update', getFullState());
        io.emit('server:timer_sync', 0);
        io.emit('server:toast', { message: `Revisiting Question ${prevIndex + 1}`, type: 'info' });
    });

    // --- Review Mode ---
    socket.on('host:start_review', () => {
        quizState.status = 'reviewing';
        quizState.currentQuestionIndex = 0;
        quizState.acceptingAnswers = false;
        quizState.questionStartTime = null;

        io.emit('server:state_update', getFullState());
        io.emit('server:toast', { message: 'Review Mode — Question 1', type: 'info' });
    });

    socket.on('host:review_next', () => {
        if (quizState.status !== 'reviewing') return;
        const totalQuestions = questions.length;
        quizState.currentQuestionIndex = Math.min(quizState.currentQuestionIndex + 1, totalQuestions - 1);
        io.emit('server:state_update', getFullState());
    });

    socket.on('host:review_prev', () => {
        if (quizState.status !== 'reviewing') return;
        quizState.currentQuestionIndex = Math.max(quizState.currentQuestionIndex - 1, 0);
        io.emit('server:state_update', getFullState());
    });

    socket.on('host:reveal_answer', () => {
        if (quizState.status !== 'active') return;

        quizState.acceptingAnswers = false;
        quizState.status = 'revealed';

        const question = questions.find(q => q.questionId === quizState.currentQuestionIndex + 1);
        let currentSubs = submissions.filter(s => s.questionIndex === quizState.currentQuestionIndex);

        // Handle skipped teams
        const allTeamIds = ['A', 'B', 'C', 'D'];
        const submittedTeamIds = currentSubs.map(s => s.teamId);

        for (const tid of allTeamIds) {
            if (!submittedTeamIds.includes(tid)) {
                const skipSub = {
                    _id: `skip_${tid}_${quizState.currentQuestionIndex}`,
                    teamId: tid,
                    questionIndex: quizState.currentQuestionIndex,
                    answer: null,
                    lockedAt: new Date(),
                    isCorrect: false,
                    skipped: true,
                    pointsAwarded: 0
                };
                submissions.push(skipSub);
                currentSubs.push(skipSub);
            }
        }

        // Identify correct answers
        currentSubs = currentSubs.map(sub => {
            if (!sub.skipped) {
                if (question.type === 'fill') {
                    // Lenient matching for fill-in-the-blank: trim, case-insensitive, ignore trailing parentheses differences
                    const normalize = (s) => s.trim().toLowerCase().replace(/[()\s.]/g, '');
                    sub.isCorrect = normalize(sub.answer || '') === normalize(question.correctAnswer);
                } else {
                    sub.isCorrect = sub.answer === question.correctAnswer;
                }
            }
            return sub;
        });

        // Score calculations
        const scoredSubmissions = calculateScores(currentSubs);

        // Update scores on teams
        for (const sub of scoredSubmissions) {
            const team = teams.find(t => t.teamId === sub.teamId);
            if (team) {
                team.score += (sub.pointsAwarded || 0);
            }
        }

        io.emit('server:state_update', getFullState());
        io.emit('server:toast', { message: 'Answers Revealed!', type: 'info' });
    });

    socket.on('team:lock_answer', (data) => {
        const { teamId, answer } = data;

        if (!quizState.acceptingAnswers) return;

        // Check if team already submitted
        const existing = submissions.find(s =>
            s.teamId === teamId && s.questionIndex === quizState.currentQuestionIndex
        );
        if (existing) return;

        const sub = {
            _id: `sub_${teamId}_${quizState.currentQuestionIndex}_${Date.now()}`,
            teamId,
            questionIndex: quizState.currentQuestionIndex,
            answer,
            lockedAt: new Date(),
            isCorrect: false,
            skipped: false,
            pointsAwarded: 0
        };

        submissions.push(sub);

        io.emit('server:state_update', getFullState());
    });

    socket.on('host:time_up', () => {
        quizState.acceptingAnswers = false;
        io.emit('server:state_update', getFullState());
    });

    socket.on('host:update_score', ({ teamId, delta }) => {
        const team = teams.find(t => t.teamId === teamId);
        if (team) {
            team.score += delta;
        }
        io.emit('server:state_update', getFullState());
    });

    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, '| Reason:', reason, '| Remaining:', io.engine.clientsCount);
    });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        questions: questions.length,
        teams: teams.length,
        quizStatus: quizState.status
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
