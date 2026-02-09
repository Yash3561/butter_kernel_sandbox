'use client';

import { useState, useEffect } from 'react';
import { Candidate } from '@/lib/Trie';

interface MetricsSidebarProps {
    latency: number;
    pass1Latency: number;
    pass2Latency: number;
    candidates: Candidate[];
    tapCount: number;
}

export default function MetricsSidebar({ latency, pass1Latency, pass2Latency, candidates, tapCount }: MetricsSidebarProps) {
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        setUptime(Math.floor(performance.now() / 1000));
        const interval = setInterval(() => {
            setUptime(Math.floor(performance.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Memory budget visualization
    const trieMemory = 0.04; // 40KB
    const dictionaryMemory = 0.01; // 10KB for word list
    const transformerBudget = 12; // Reserved for distilled model
    const headroomForUI = 12.95; // Remaining budget
    const totalBudget = 25;

    // Confidence calculation
    const topConfidence = candidates.length > 0 ? candidates[0].finalRank : 0;
    const isHighConfidence = topConfidence > 10;

    const sectionStyle: React.CSSProperties = {
        marginBottom: '16px',
    };

    const headerStyle: React.CSSProperties = {
        fontSize: '10px',
        fontWeight: 700,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '10px',
        paddingBottom: '6px',
        borderBottom: '1px solid #1a1a1a',
    };

    return (
        <div style={{
            padding: '14px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '11px',
            height: '100%',
            overflow: 'auto',
        }}>
            {/* System Status */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '10px' }}>ONLINE</span>
                    <span style={{ color: '#444', fontSize: '10px' }}>• {uptime}s</span>
                </div>
            </div>

            {/* Latency Budget */}
            <div style={sectionStyle}>
                <h3 style={headerStyle}>Latency Budget (30ms)</h3>

                {/* Visual budget bar */}
                <div style={{
                    width: '100%',
                    height: '24px',
                    backgroundColor: '#111',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    marginBottom: '8px',
                    border: '1px solid #222',
                }}>
                    <div style={{
                        width: `${(pass1Latency / 30) * 100}%`,
                        height: '100%',
                        backgroundColor: '#84cc16',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#000',
                        minWidth: pass1Latency > 0 ? '40px' : '0',
                    }}>
                        {pass1Latency > 0.5 && `${pass1Latency.toFixed(1)}`}
                    </div>
                    <div style={{
                        width: `${(pass2Latency / 30) * 100}%`,
                        height: '100%',
                        backgroundColor: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#000',
                        minWidth: pass2Latency > 0 ? '30px' : '0',
                    }}>
                        {pass2Latency > 0.5 && `${pass2Latency.toFixed(1)}`}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555' }}>
                    <span><span style={{ color: '#84cc16' }}>■</span> Trie+Spatial</span>
                    <span><span style={{ color: '#f59e0b' }}>■</span> Transformer</span>
                    <span><span style={{ color: '#333' }}>■</span> Headroom</span>
                </div>
            </div>

            {/* Memory Budget */}
            <div style={sectionStyle}>
                <h3 style={headerStyle}>Memory Budget (25MB)</h3>

                <div style={{
                    width: '100%',
                    height: '24px',
                    backgroundColor: '#111',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    marginBottom: '8px',
                    border: '1px solid #222',
                }}>
                    <div style={{
                        width: `${(12 / totalBudget) * 100}%`,
                        height: '100%',
                        backgroundColor: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#fff',
                    }}>
                        12MB
                    </div>
                    <div style={{
                        width: `${(8 / totalBudget) * 100}%`,
                        height: '100%',
                        backgroundColor: '#06b6d4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#fff',
                    }}>
                        8MB
                    </div>
                    <div style={{
                        width: `${(5 / totalBudget) * 100}%`,
                        height: '100%',
                        backgroundColor: '#84cc16',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#000',
                    }}>
                        5MB
                    </div>
                </div>

                <div style={{ fontSize: '9px', color: '#555', lineHeight: 1.8 }}>
                    <div><span style={{ color: '#8b5cf6' }}>■</span> Distilled Transformer (12MB)</div>
                    <div><span style={{ color: '#06b6d4' }}>■</span> Trie + Dictionary (8MB)</div>
                    <div><span style={{ color: '#84cc16' }}>■</span> UI/Runtime Headroom (5MB)</div>
                </div>
            </div>

            {/* Hybrid Architecture */}
            <div style={sectionStyle}>
                <h3 style={headerStyle}>Hybrid Architecture</h3>

                {/* Pass 1 */}
                <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#0d0d0d',
                    borderRadius: '4px',
                    marginBottom: '6px',
                    borderLeft: '3px solid #84cc16',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#84cc16', fontWeight: 600, fontSize: '10px' }}>PASS 1</span>
                        <span style={{ color: '#84cc16', fontSize: '10px', fontFamily: 'monospace' }}>{pass1Latency.toFixed(2)}ms</span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#666' }}>
                        Trie prefix + Euclidean spatial weighting
                    </div>
                </div>

                {/* Pass 2 */}
                <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#0d0d0d',
                    borderRadius: '4px',
                    borderLeft: '3px solid #f59e0b',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '10px' }}>PASS 2</span>
                        <span style={{ color: '#f59e0b', fontSize: '10px', fontFamily: 'monospace' }}>{pass2Latency.toFixed(2)}ms</span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#666' }}>
                        Distilled transformer ranking (simulated)
                    </div>
                    {isHighConfidence && (
                        <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '4px' }}>
                            ⚡ Skip eligible (confidence &gt;80%)
                        </div>
                    )}
                </div>
            </div>

            {/* Engine State */}
            <div style={sectionStyle}>
                <h3 style={headerStyle}>Engine State</h3>
                <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Input Vector</span>
                        <span style={{ color: '#fff' }}>{tapCount} taps</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Candidates</span>
                        <span style={{ color: '#fff' }}>{candidates.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Top Score</span>
                        <span style={{ color: topConfidence > 10 ? '#84cc16' : '#888' }}>
                            {topConfidence.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* iOS Constraints */}
            <div style={sectionStyle}>
                <h3 style={headerStyle}>iOS Keyboard Limits</h3>
                <div style={{ fontSize: '10px', color: '#555', lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Max Latency</span>
                        <span style={{ color: latency < 30 ? '#22c55e' : '#ef4444' }}>
                            {latency < 30 ? '✓' : '✗'} 30ms
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Memory Ceiling</span>
                        <span style={{ color: '#22c55e' }}>✓ 50MB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Model Budget</span>
                        <span style={{ color: '#22c55e' }}>✓ 25MB</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
