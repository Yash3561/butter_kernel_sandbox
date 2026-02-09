'use client';
import { Candidate } from '@/lib/Trie';
import { useState, useEffect } from 'react';

interface EngineTraceProps {
    candidates: Candidate[];
}

export default function EngineTrace({ candidates }: EngineTraceProps) {
    const [traceId, setTraceId] = useState<string>("...");

    useEffect(() => {
        setTraceId(Date.now().toString().slice(-8));
    }, [candidates]);

    return (
        <div className="dashboard-panel border-r border-neutral-800 flex flex-col h-full font-mono text-xs md:text-sm">
            <h2 className="text-accent-amber font-bold mb-4 uppercase tracking-wider text-xs border-b border-neutral-800 pb-2">
                Engine Trace (Pass 2)
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-neutral-500 text-[10px] uppercase">
                            <th className="pb-2 pl-2">Rank</th>
                            <th className="pb-2">Word</th>
                            <th className="pb-2">Prefix</th>
                            <th className="pb-2 text-right">Spatial</th>
                            <th className="pb-2 text-right pr-2">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {candidates.map((c, i) => (
                            <tr key={c.word} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="py-2 pl-2 text-neutral-500">#{i + 1}</td>
                                <td className="py-2 text-accent-lime font-bold">{c.word}</td>
                                <td className="py-2 text-neutral-400">{c.prefixMatch}</td>
                                <td className="py-2 text-right text-accent-amber">{c.spatialScore.toFixed(2)}</td>
                                <td className="py-2 text-right pr-2 text-white">{c.finalRank.toFixed(1)}</td>
                            </tr>
                        ))}
                        {candidates.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-neutral-600 italic">
                                    Waiting for input stream...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-auto pt-4 border-t border-neutral-800 text-[10px] text-neutral-600">
                <p>trace_id: {traceId}</p>
                <p>status: LISTENING</p>
            </div>
        </div>
    );
}
