import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import { Lock, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';

const CodeBlock = ({ code }) => (
    <pre className="text-xs leading-relaxed font-mono whitespace-pre overflow-x-auto scrollbar-thin">
        <code>{code}</code>
    </pre>
);

const TeamDashboard = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { socket, quizState, timer } = useSocket();
    const [selectedOption, setSelectedOption] = useState('');
    const [isLocked, setIsLocked] = useState(false);

    // Derive my team from state
    const myTeam = quizState?.teams?.find(t => t.teamId.toLowerCase() === teamId.toLowerCase());
    const formattedTeamId = myTeam ? myTeam.teamId : teamId.toUpperCase();

    // Reset local state when a new question arrives
    useEffect(() => {
        if (quizState?.state?.status === 'active') {
            const existingSub = quizState.submissions.find(s => s.teamId === formattedTeamId);
            if (existingSub) {
                setIsLocked(true);
                setSelectedOption(existingSub.answer || '');
            } else {
                setIsLocked(false);
                setSelectedOption('');
            }
        }
    }, [quizState?.state?.currentQuestionIndex, quizState?.state?.status, quizState?.submissions, formattedTeamId, navigate]);


    if (!quizState || !quizState.state) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="glass-strong p-8 rounded-2xl text-center text-xl font-semibold text-violet-300 animate-pulse">
                Connecting to server...
            </div>
        </div>
    );

    const { state, question, teams, submissions } = quizState;
    const totalQuestions = quizState.totalQuestions || 0;
    const mySubmission = submissions.find(s => s.teamId === formattedTeamId);

    const handleLock = () => {
        if (!selectedOption) return;
        socket.emit('team:lock_answer', { teamId: formattedTeamId, answer: selectedOption });
        setIsLocked(true);
    };

    if (!myTeam) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-strong p-8 rounded-2xl text-center text-red-400 font-bold text-xl">Invalid Team ID</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto w-full px-6 flex flex-col gap-6 min-h-screen">

            {/* Global Stylish Header */}
            <div className="w-full flex flex-col items-center mt-4 mb-2">
                <img src="/newlogo_clean.png" alt="SynergySquad" className="h-48 md:h-64 max-w-3xl w-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-[0.3em] mt-1">Live Quiz Arena</p>
            </div>

            {/* Header */}
            <div className="glass-strong p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        <span className="text-violet-400">{myTeam.name}</span> Dashboard
                    </h2>
                    <p className="text-zinc-400 mt-1">Score: <span className="font-bold text-blue-400">{myTeam.score} pts</span></p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Status</span>
                    <div className="font-semibold text-violet-400 capitalize leading-none mt-1">{state.status}</div>
                </div>
            </div>

            {state.status === 'waiting' && (
                <div className="glass-strong border border-blue-500/20 p-12 text-center rounded-2xl flex flex-col items-center justify-center">
                    <AlertCircle size={48} className="text-blue-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Waiting for Host...</h2>
                    <p className="text-zinc-400 mt-2">The quiz will start shortly.</p>
                </div>
            )}

            {state.status === 'finished' && (
                <div className="glass-strong border border-emerald-500/20 p-12 text-center rounded-2xl">
                    <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-emerald-400 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Quiz Finished!</h2>
                    <p className="text-zinc-400 text-lg">Waiting for the host to start the answer review...</p>
                    <div className="mt-6">
                        <Leaderboard teams={teams} />
                    </div>
                </div>
            )}

            {(state.status === 'active' || state.status === 'revealed') && question && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Main Question Area */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <div className="glass-strong p-8 rounded-2xl border-t-2 border-blue-500/60 relative overflow-hidden">

                            {/* Question Text */}
                            <h2 className="text-violet-400 font-bold uppercase tracking-widest text-sm mb-4">Question {state.currentQuestionIndex + 1} of {totalQuestions}</h2>
                            <p className="text-2xl md:text-3xl font-semibold leading-snug text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.text}</p>
                            {question.questionImages && (
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    {question.questionImages.map((img, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                            <img src={img} alt={`Question part ${idx + 1}`} className="w-full max-h-[350px] object-contain rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {question.questionImage && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                    <img src={question.questionImage} alt="Question" className="w-full max-h-[350px] object-contain rounded-lg" />
                                </div>
                            )}

                            {question.optionLabel && (
                                <p className="text-lg md:text-xl font-semibold text-zinc-300 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.optionLabel}</p>
                            )}

                            {/* Input Area */}
                            {question.type === 'mcq' ? (
                                <div className={`grid gap-4 ${question.optionType === 'image' ? 'grid-cols-2' : question.optionType === 'code' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                    {question.options.map((opt, i) => {
                                        const isSelected = selectedOption === opt;
                                        const isCorrect = question.correctAnswer === opt;
                                        const showRevealColors = state.status === 'revealed';
                                        const codeSnippet = question.codeSnippets ? question.codeSnippets[i] : null;
                                        const optionImage = question.optionImages ? question.optionImages[i] : null;

                                        let bgClass = "glass hover:bg-white/10 text-zinc-300";

                                        if (showRevealColors) {
                                            if (isCorrect) {
                                                bgClass = "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                                            } else if (isSelected && !isCorrect) {
                                                bgClass = "bg-red-500/15 border-red-500/50 text-red-300";
                                            }
                                        } else if (isSelected) {
                                            bgClass = "bg-blue-500/15 border-blue-500/50 ring-2 ring-blue-500/20 text-blue-200 font-semibold";
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => !isLocked && state.acceptingAnswers && setSelectedOption(opt)}
                                                disabled={isLocked || !state.acceptingAnswers}
                                                className={`text-left rounded-xl border border-white/10 transition-all duration-200 flex flex-col ${bgClass} ${isLocked || !state.acceptingAnswers ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${codeSnippet || optionImage ? 'p-3' : 'p-5'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-block w-8 h-8 bg-white/10 border border-white/20 rounded-lg text-center leading-8 font-bold text-sm ${showRevealColors && isCorrect ? 'border-emerald-500/50 text-emerald-400' : ''}`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                    {showRevealColors && isCorrect && <CheckCircle className="text-emerald-400" size={18} />}
                                                </div>
                                                {optionImage ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-1 flex-1 overflow-hidden w-full">
                                                        <img src={optionImage} alt={`Option ${String.fromCharCode(65 + i)}`} className="w-full max-h-[180px] object-contain rounded" />
                                                    </div>
                                                ) : codeSnippet ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-3 flex-1 overflow-hidden w-full">
                                                        <CodeBlock code={codeSnippet} />
                                                    </div>
                                                ) : (
                                                    <span className="text-lg">{opt}</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <label className="font-semibold text-zinc-300">Type your answer:</label>
                                    <input
                                        type="text"
                                        value={selectedOption}
                                        onChange={(e) => setSelectedOption(e.target.value)}
                                        disabled={isLocked || !state.acceptingAnswers}
                                        className={`w-full p-4 text-xl rounded-xl focus:outline-none transition-all bg-white/5 border text-white placeholder-zinc-600
                      ${isLocked || !state.acceptingAnswers
                                                ? 'border-white/10 text-zinc-500 cursor-not-allowed'
                                                : 'border-blue-500/30 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20'}
                     `}
                                        placeholder="Enter answer here..."
                                    />
                                    {state.status === 'revealed' && (
                                        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-lg">
                                            <span className="font-bold text-emerald-400">Correct Answer:</span> <span className="font-semibold text-emerald-200 ml-2">{question.correctAnswer}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                                {state.status === 'active' && !isLocked && state.acceptingAnswers && (
                                    <button
                                        onClick={handleLock}
                                        disabled={!selectedOption}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                                    >
                                        <Lock size={20} /> Lock Answer
                                    </button>
                                )}

                                {(isLocked || !state.acceptingAnswers) && state.status === 'active' && (
                                    <div className="flex items-center gap-3 bg-blue-500/10 text-blue-300 px-6 py-4 rounded-xl border border-blue-500/30 font-bold w-full justify-center">
                                        <Lock size={20} className="text-blue-400" />
                                        {isLocked ? "Answer Locked Successfully" : "Time is up! Waiting for reveal..."}
                                    </div>
                                )}
                            </div>

                            {/* Feedback overlay when revealed */}
                            {state.status === 'revealed' && mySubmission && (
                                <div className={`mt-6 p-5 rounded-xl border flex items-center justify-between
                  ${mySubmission.skipped ? 'bg-zinc-800/50 border-zinc-600 text-zinc-400' :
                                        mySubmission.isCorrect ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
                                            'bg-red-500/15 border-red-500/40 text-red-300'
                                    }
                `}>
                                    <div>
                                        <h3 className="font-bold text-xl uppercase tracking-wider mb-1">
                                            {mySubmission.skipped ? 'Skipped' : mySubmission.isCorrect ? 'Correct!' : 'Incorrect'}
                                        </h3>
                                        <p className="opacity-80 text-sm font-medium">Points Awarded: {mySubmission.pointsAwarded}</p>
                                    </div>
                                    <div className="text-4xl font-black opacity-30">
                                        {mySubmission.pointsAwarded > 0 ? `+${mySubmission.pointsAwarded}` : mySubmission.pointsAwarded}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="flex flex-col gap-6">
                        {/* Timer */}
                        {state.status === 'active' && (
                            <div className="glass-strong p-6 rounded-2xl flex flex-col items-center justify-center">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-3">Time Remaining</p>
                                <Timer seconds={timer} />
                            </div>
                        )}

                        {/* Mini Leaderboard */}
                        <Leaderboard teams={teams} />
                    </div>

                </div>
            )}

            {/* Review Mode */}
            {state.status === 'reviewing' && question && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <div className="glass-strong p-8 rounded-2xl border-t-2 border-emerald-500/60">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Review — Question {state.currentQuestionIndex + 1} of {totalQuestions}</h2>
                                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">Review Mode</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-semibold leading-snug text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.text}</p>
                            {question.questionImages && (
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    {question.questionImages.map((img, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                            <img src={img} alt={`Question part ${idx + 1}`} className="w-full max-h-[350px] object-contain rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {question.questionImage && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-[#1a1b2e] p-2">
                                    <img src={question.questionImage} alt="Question" className="w-full max-h-[350px] object-contain rounded-lg" />
                                </div>
                            )}

                            {question.optionLabel && (
                                <p className="text-lg md:text-xl font-semibold text-zinc-300 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question.optionLabel}</p>
                            )}

                            {question.type === 'mcq' ? (
                                <div className={`grid gap-4 ${question.optionType === 'image' ? 'grid-cols-2' : question.optionType === 'code' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                    {question.options.map((opt, i) => {
                                        const isCorrect = opt === question.correctAnswer;
                                        const codeSnippet = question.codeSnippets ? question.codeSnippets[i] : null;
                                        const optionImage = question.optionImages ? question.optionImages[i] : null;
                                        return (
                                            <div
                                                key={i}
                                                className={`rounded-xl border transition-all flex flex-col
                                                    ${isCorrect
                                                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                        : 'glass text-zinc-300'}
                                                    ${codeSnippet || optionImage ? 'p-3' : 'p-5 font-medium text-lg'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-block w-8 h-8 bg-white/10 border border-white/20 rounded-lg text-center leading-8 font-bold text-sm ${isCorrect ? 'border-emerald-500/50 text-emerald-400' : ''}`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                    {isCorrect && <CheckCircle className="text-emerald-400" size={18} />}
                                                </div>
                                                {optionImage ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-1 flex-1 overflow-hidden">
                                                        <img src={optionImage} alt={`Option ${String.fromCharCode(65 + i)}`} className="w-full max-h-[180px] object-contain rounded" />
                                                    </div>
                                                ) : codeSnippet ? (
                                                    <div className="bg-[#1a1b2e] rounded-lg p-3 flex-1 overflow-hidden">
                                                        <CodeBlock code={codeSnippet} />
                                                    </div>
                                                ) : (
                                                    <span className="text-lg">{opt}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
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
                    </div>

                    <div className="flex flex-col gap-6">
                        <Leaderboard teams={teams} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamDashboard;
