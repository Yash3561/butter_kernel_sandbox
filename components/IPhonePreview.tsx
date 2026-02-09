'use client';

import { useState, useEffect } from 'react';

interface IPhonePreviewProps {
    input: string;
    suggestion: string;
}

export default function IPhonePreview({ input, suggestion }: IPhonePreviewProps) {
    const [cursorVisible, setCursorVisible] = useState(true);

    // Cursor blink effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCursorVisible(prev => !prev);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const currentWord = input.split(' ').pop() || '';
    const suggestedRest = suggestion.length > currentWord.length ? suggestion.slice(currentWord.length) : '';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            width: '100%',
            maxWidth: '550px',
        }}>
            {/* Label */}
            <div style={{
                width: '100%',
                textAlign: 'left',
                fontSize: '11px',
                color: '#555',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '12px',
            }}>
                📱 iOS Text Field Simulation
            </div>

            {/* Text Field */}
            <div style={{
                width: '100%',
                background: 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(100, 100, 100, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <span style={{
                    fontSize: '28px',
                    color: '#fff',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    letterSpacing: '0.5px',
                    lineHeight: 1.4,
                }}>
                    {input}
                    <span style={{ color: 'rgba(132, 204, 22, 0.5)' }}>{suggestedRest}</span>
                    <span style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '32px',
                        backgroundColor: cursorVisible ? '#84cc16' : 'transparent',
                        marginLeft: '2px',
                        verticalAlign: 'middle',
                        transition: 'background-color 0.1s',
                    }} />
                </span>
            </div>

            {/* Suggestion Pills */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap',
            }}>
                {suggestion && (
                    <div style={{
                        padding: '10px 20px',
                        background: 'rgba(132, 204, 22, 0.15)',
                        border: '1px solid rgba(132, 204, 22, 0.4)',
                        borderRadius: '12px',
                        color: '#84cc16',
                        fontSize: '15px',
                        fontWeight: 500,
                        boxShadow: '0 0 15px rgba(132, 204, 22, 0.2)',
                    }}>
                        &ldquo;{suggestion}&rdquo;
                    </div>
                )}
                {currentWord && currentWord !== suggestion && (
                    <div style={{
                        padding: '10px 20px',
                        background: '#222',
                        border: '1px solid #444',
                        borderRadius: '12px',
                        color: '#888',
                        fontSize: '15px',
                    }}>
                        &ldquo;{currentWord}&rdquo;
                    </div>
                )}
                {!suggestion && !currentWord && (
                    <div style={{
                        padding: '10px 20px',
                        color: '#555',
                        fontSize: '14px',
                        fontStyle: 'italic',
                    }}>
                        Start typing...
                    </div>
                )}
            </div>
        </div>
    );
}
