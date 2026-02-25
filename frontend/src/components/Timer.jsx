import React from 'react';

const Timer = ({ seconds }) => {
    const percentage = (seconds / 90) * 100;

    let barColor = 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
    let textColor = 'text-emerald-400';
    if (seconds <= 20) {
        barColor = 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]';
        textColor = 'text-yellow-400';
    }
    if (seconds <= 10) {
        barColor = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
        textColor = 'text-red-400';
    }

    return (
        <div className="flex flex-col items-center">
            <div className={`text-5xl font-bold mb-3 font-mono ${textColor} transition-colors duration-500`}
                style={{ fontFamily: "'Orbitron', monospace" }}>
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-linear`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default Timer;
