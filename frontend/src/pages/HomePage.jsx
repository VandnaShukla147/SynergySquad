import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users } from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl glass-strong p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center">

                {/* Hero Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <img src="/newlogo_clean.png" alt="SynergySquad" className="h-60 md:h-80 max-w-4xl w-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]" />
                    <p className="text-lg font-semibold text-zinc-400 uppercase tracking-[0.3em] mt-3">
                        Live Quiz Arena
                    </p>
                </div>

                <p className="text-zinc-400 text-base mb-10 max-w-md leading-relaxed">
                    Welcome to the ultimate real-time quiz platform. Select your role to enter the arena.
                </p>

                {/* Entry Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

                    {/* Host Box */}
                    <button
                        onClick={() => navigate('/host')}
                        className="group flex flex-col items-center justify-center p-8 glass rounded-2xl hover:bg-white/10 hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all duration-300">
                            <Play size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Quiz Host</h2>
                        <p className="text-sm text-zinc-400">Control the quiz, reveal answers, and manage teams.</p>
                    </button>

                    {/* Team Box */}
                    <div className="flex flex-col items-center justify-center p-8 glass rounded-2xl">
                        <div className="w-16 h-16 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Team Entry</h2>

                        <div className="flex gap-3 w-full flex-wrap justify-center mt-2">
                            {[
                                { id: 'A', name: 'AttackOnTitans' },
                                { id: 'B', name: 'AlgoLooms' },
                                { id: 'C', name: 'Moonshine Coders' },
                                { id: 'D', name: 'CrossCity Coders' }
                            ].map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => navigate(`/team/${team.id}`)}
                                    className="bg-white/5 border border-violet-500/30 text-violet-300 hover:bg-violet-500 hover:text-white hover:border-violet-400 font-semibold px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] w-full sm:w-auto text-sm cursor-pointer"
                                >
                                    {team.name}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <p className="mt-8 text-sm text-zinc-600 font-medium">Powered by React, Node.js & Socket.io</p>
        </div>
    );
};

export default HomePage;
