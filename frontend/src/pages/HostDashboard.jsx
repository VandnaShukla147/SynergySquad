import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import { Settings, Play, Target, CheckCircle, Clock, RotateCcw, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const CodeBlock = ({ code }) => (
    <pre className="text-xs leading-relaxed font-mono whitespace-pre overflow-x-auto scrollbar-thin">
        <code>{code}</code>
    </pre>
);

const HostDashboard = () => {
    const { socket, quizState, timer } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        // Backend now handles the 90-second timeout automatically.
    }, []);

    if (!quizState || !quizState.state) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="glass-strong p-8 rounded-2xl text-center text-xl font-semibold text-violet-300 animate-pulse">
                Connecting to server...
            </div>
        </div>
    );

    const { state, question, teams, submissions } = quizState;
    const totalQuestions = quizState.totalQuestions || 0;

    const handleStart = () => socket.emit('host:start_quiz');
    const handleNext = () => socket.emit('host:next_question');
    const handleReveal = () => socket.emit('host:reveal_answer');
    const handleScoreAdjust = (teamId, delta) => socket.emit('host:update_score', { teamId, delta });
    const handleRestart = () => {
        if (window.confirm("Are you sure you want to completely restart the quiz? This will wipe all current scores and submissions.")) {
            socket.emit('host:restart_quiz');
            navigate('/');
        }
    };
    const handleStartReview = () => socket.emit('host:start_review');
    const handleReviewNext = () => socket.emit('host:review_next');
    const handleReviewPrev = () => socket.emit('host:review_prev');

    // Find out who locked and who hasn't
    const getTeamStatus = (teamId) => {
        const sub = submissions.find(s => s.teamId === teamId);
        if (!sub) return { status: 'waiting', icon: <Clock size={16} className="text-zinc-500" /> };
        if (state.status === 'revealed') {
            if (sub.skipped) return { status: 'skipped', color: 'text-zinc-400', bg: 'bg-zinc-800/50' };
            if (sub.isCorrect) return { status: `Correct (+${sub.pointsAwarded})`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
            return { status: `Wrong (${sub.pointsAwarded})`, color: 'text-red-400', bg: 'bg-red-500/10' };
        }
        return { status: 'Locked', icon: <CheckCircle size={16} className="text-blue-400" />, time: new Date(sub.lockedAt).toLocaleTimeString() };
    };

    return (
        <div className="w-full px-6 xl:px-10 flex flex-col gap-6 min-h-screen">
            {/* Global Stylish Header */}
            <div className="w-full flex flex-col items-center mb-2">
                <img src="/newlogo_clean.png" alt="SynergySquad" className="h-52 md:h-72 max-w-3xl w-full object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.5)]" />
                <p className="text-base font-semibold text-zinc-500 uppercase tracking-[0.3em] mt-2">Live Quiz Arena</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Controls & Question/Leaderboard */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Header & Controls */}
                    <div className="glass-strong p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Master Dashboard</h2>
                            <p className="text-zinc-400 mt-1">Status: <span className="font-semibold uppercase text-sm tracking-wider text-violet-400">{state.status}</span></p>
                        </div>
                        <div className="flex gap-3">
                            {state.status !== 'waiting' && (
                                <button onClick={handleRestart} className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer">
                                    <RotateCcw size={20} /> Restart
                                </button>
                            )}

                            {state.status === 'waiting' || state.status === 'finished' ? (
                                <>
                                    {state.status === 'finished' && (
                                        <button onClick={handleStartReview} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer">
                                            <BookOpen size={20} /> Review Answers
                                        </button>
                                    )}
                                    <button onClick={handleStart} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] cursor-pointer">
                                        <Play size={20} /> Start Quiz
                                    </button>
                                </>
                            ) : (
                                <>
                                    {state.status === 'active' && (
                                        <button onClick={handleReveal} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] cursor-pointer">
                                            <Target size={20} /> Reveal Answer
                                        </button>
                                    )}
                                    {state.status === 'revealed' && (
                                        <div className="flex gap-3">
                                            {state.currentQuestionIndex > 0 && (
                                                <button onClick={() => socket.emit('host:prev_question')} className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer">
                                                    <ChevronLeft size={20} /> Prev
                                                </button>
                                            )}
                                            <button onClick={handleNext} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] cursor-pointer">
                                                {state.currentQuestionIndex + 1 >= totalQuestions ? 'Finish Quiz' : 'Next Question'}
                                            </button>
                                        </div>
                                    )}
                                    {state.status === 'reviewing' && (
                                        <div className="flex gap-3">
                                            <button onClick={handleReviewPrev} disabled={state.currentQuestionIndex <= 0} className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer">
                                                <ChevronLeft size={20} /> Prev
                                            </button>
                                            <button onClick={handleReviewNext} disabled={state.currentQuestionIndex + 1 >= totalQuestions} className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer">
                                                Next <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Current Question View */}
                    {question && (state.status === 'active' || state.status === 'revealed') && (
                        <div className="glass-strong p-8 rounded-2xl border-t-2 border-blue-500/60">
                            <h2 className="text-violet-400 font-bold uppercase tracking-widest text-sm mb-4">Question {state.currentQuestionIndex + 1} of {totalQuestions}</h2>
                            <p className="text-2xl md:text-4xl font-semibold leading-snug text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.text}</p>
                            {question.questionImages && (
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    {question.questionImages.map((img, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                            <img src={img} alt={`Question part ${idx + 1}`} className="w-full max-h-[400px] object-contain rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {question.questionImage && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                    <img src={question.questionImage} alt="Question" className="w-full max-h-[400px] object-contain rounded-lg" />
                                </div>
                            )}

                            {question.optionLabel && (
                                <p className="text-lg md:text-xl font-semibold text-zinc-300 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.optionLabel}</p>
                            )}

                            {question.type === 'mcq' && (
                                <div className={`grid gap-4 ${question.optionType === 'image' ? 'grid-cols-2' : question.optionType === 'code' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                    {question.options.map((opt, i) => {
                                        const isCorrectRevealed = state.status === 'revealed' && opt === question.correctAnswer;
                                        const codeSnippet = question.codeSnippets ? question.codeSnippets[i] : null;
                                        const optionImage = question.optionImages ? question.optionImages[i] : null;
                                        return (
                                            <div key={i} className={`rounded-xl border transition-all flex flex-col
                                                ${isCorrectRevealed
                                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                    : 'glass text-zinc-300'}
                                                ${codeSnippet || optionImage ? 'p-3' : 'p-5 font-medium text-xl'}
                                            `}>
                                                <span className={`inline-block w-8 h-8 bg-white/10 border border-white/20 rounded-lg text-center leading-8 mb-2 text-sm font-bold ${isCorrectRevealed ? 'border-emerald-500/50 text-emerald-400' : ''}`}>{String.fromCharCode(65 + i)}</span>
                                                {optionImage ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-1 flex-1 overflow-hidden">
                                                        <img src={optionImage} alt={`Option ${String.fromCharCode(65 + i)}`} className="w-full max-h-[200px] object-contain rounded" />
                                                    </div>
                                                ) : codeSnippet ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-3 flex-1 overflow-hidden">
                                                        <CodeBlock code={codeSnippet} />
                                                    </div>
                                                ) : (
                                                    <span>{opt}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {question.type === 'fill' && state.status === 'active' && (
                                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <span className="font-semibold text-blue-300">Fill in the blank — Teams are typing their answers...</span>
                                </div>
                            )}

                            {question.type === 'fill' && state.status === 'revealed' && (
                                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <span className="font-bold text-emerald-400">Correct Answer:</span> <span className="text-xl text-emerald-200 ml-2">{question.correctAnswer}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review Mode View */}
                    {question && state.status === 'reviewing' && (
                        <div className="glass-strong p-8 rounded-2xl border-t-2 border-emerald-500/60">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Review — Question {state.currentQuestionIndex + 1} of {totalQuestions}</h2>
                                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">Review Mode</span>
                            </div>
                            <p className="text-2xl md:text-4xl font-semibold leading-snug text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.text}</p>
                            {question.questionImages && (
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    {question.questionImages.map((img, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                            <img src={img} alt={`Question part ${idx + 1}`} className="w-full max-h-[400px] object-contain rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {question.questionImage && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                    <img src={question.questionImage} alt="Question" className="w-full max-h-[400px] object-contain rounded-lg" />
                                </div>
                            )}

                            {question.optionLabel && (
                                <p className="text-lg md:text-xl font-semibold text-zinc-300 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.optionLabel}</p>
                            )}

                            {question.type === 'mcq' && (
                                <div className={`grid gap-4 ${question.optionType === 'image' ? 'grid-cols-2' : question.optionType === 'code' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                    {question.options.map((opt, i) => {
                                        const isCorrect = opt === question.correctAnswer;
                                        const codeSnippet = question.codeSnippets ? question.codeSnippets[i] : null;
                                        const optionImage = question.optionImages ? question.optionImages[i] : null;
                                        return (
                                            <div key={i} className={`rounded-xl border transition-all flex flex-col
                                                ${isCorrect
                                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                    : 'glass text-zinc-300'}
                                                ${codeSnippet || optionImage ? 'p-3' : 'p-5 font-medium text-xl'}
                                            `}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-block w-8 h-8 bg-white/10 border border-white/20 rounded-lg text-center leading-8 text-sm font-bold ${isCorrect ? 'border-emerald-500/50 text-emerald-400' : ''}`}>{String.fromCharCode(65 + i)}</span>
                                                    {isCorrect && <CheckCircle className="text-emerald-400" size={18} />}
                                                </div>
                                                {optionImage ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-1 flex-1 overflow-hidden">
                                                        <img src={optionImage} alt={`Option ${String.fromCharCode(65 + i)}`} className="w-full max-h-[200px] object-contain rounded" />
                                                    </div>
                                                ) : codeSnippet ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-3 flex-1 overflow-hidden">
                                                        <CodeBlock code={codeSnippet} />
                                                    </div>
                                                ) : (
                                                    <span>{opt}{isCorrect && <CheckCircle className="inline ml-3 text-emerald-400" size={22} />}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {question.type === 'fill' && (
                                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <span className="font-bold text-emerald-400">Correct Answer:</span> <span className="text-xl text-emerald-200 ml-2">{question.correctAnswer}</span>
                                </div>
                            )}

                            {question.justification && (
                                <div className="mt-6 p-5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200">
                                    <span className="font-bold block mb-2 text-blue-300 uppercase tracking-wider text-sm">Explanation</span>
                                    <p className="text-base leading-relaxed">{question.justification}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Finished View */}
                    {state.status === 'finished' && (
                        <div className="glass-strong p-8 rounded-3xl flex flex-col items-center justify-center text-center border-t-2 border-emerald-500/40 flex-1">
                            <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Quiz Complete!</h2>
                            <p className="text-zinc-400 text-lg max-w-md mx-auto">All questions have been answered. Click <span className="font-bold text-emerald-400">Review Answers</span> above to walk through each question with explanations.</p>
                        </div>
                    )}

                    {/* Waiting Lobby View */}
                    {state.status === 'waiting' && (
                        <div className="glass-strong p-8 rounded-3xl flex flex-col items-center justify-center text-center border-t-2 border-blue-500/40 flex-1">
                            <div className="w-20 h-20 bg-blue-500/15 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                <Target size={40} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Waiting for Host...</h2>
                            <p className="text-zinc-400 text-lg max-w-md mx-auto">Ensure all teams are ready. Click <span className="font-bold text-white">Start Quiz</span> above to begin the competition.</p>
                        </div>
                    )}

                </div>

                {/* Right Column: Timer & Teams */}
                <div className="flex flex-col gap-6">

                    {/* Timer */}
                    {state.status === 'active' && (
                        <div className="glass-strong p-6 rounded-2xl">
                            <Timer seconds={timer} />
                        </div>
                    )}

                    {/* Live Team Status */}
                    <div className="glass-strong rounded-2xl overflow-hidden">
                        <div className="bg-white/5 p-4 border-b border-white/10">
                            <h3 className="font-bold text-zinc-300 flex items-center gap-2"><Settings size={18} className="text-violet-400" /> Live Submissions</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            {(() => {
                                const lockedSubs = submissions
                                    .filter(s => s.lockedAt && !s.skipped)
                                    .sort((a, b) => new Date(a.lockedAt) - new Date(b.lockedAt));

                                const waitingTeams = teams.filter(t => !submissions.find(s => s.teamId === t.teamId && !s.skipped));

                                return (
                                    <>
                                        {lockedSubs.map((sub, idx) => {
                                            const team = teams.find(t => t.teamId === sub.teamId) || { name: 'Unknown', teamId: sub.teamId };
                                            const statusData = getTeamStatus(team.teamId);

                                            return (
                                                <div key={team.teamId} className={`p-3 rounded-xl border border-white/10 flex flex-col gap-1 ${statusData.bg || 'bg-blue-500/10'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">#{idx + 1}</span>
                                                            {team.name}
                                                        </div>
                                                        <div className={`text-sm font-semibold flex items-center gap-2 shrink-0 ${statusData.color || 'text-zinc-400'}`}>
                                                            {statusData.icon} {statusData.status}
                                                            {statusData.time && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 block ml-1">{statusData.time}</span>}
                                                        </div>
                                                    </div>
                                                    {sub.answer && state.status === 'revealed' && (
                                                        <div className="text-xs font-medium mt-1 text-zinc-400 break-words line-clamp-2" title={sub.answer}>"{sub.answer}"</div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {waitingTeams.map(team => {
                                            const statusData = getTeamStatus(team.teamId);
                                            return (
                                                <div key={team.teamId} className="p-3 rounded-xl border border-white/5 flex justify-between items-center bg-white/3 opacity-50">
                                                    <div className="font-semibold text-zinc-500 pl-8">{team.name}</div>
                                                    <div className="text-sm font-semibold flex items-center gap-2 text-zinc-600">
                                                        {statusData.icon} Waiting
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Leaderboard Module */}
                    <div className="mt-2">
                        <Leaderboard teams={teams} onScoreAdjust={handleScoreAdjust} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HostDashboard;
