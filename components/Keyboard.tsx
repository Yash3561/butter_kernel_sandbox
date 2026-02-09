'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KeyCoordinate, TapEvent } from '@/lib/Trie';

interface KeyboardProps {
    onTap: (tap: TapEvent) => void;
    onLayoutReady: (keyMap: KeyCoordinate[]) => void;
    onBackspace: () => void;
    onSpace: () => void;
    onDirectInput: (char: string) => void;
}

const LETTERS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const NUMBERS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    ['.', ',', '?', '!', "'", '#', '%', '*']
];

type KeyboardMode = 'letters' | 'numbers';

export default function Keyboard({ onTap, onLayoutReady, onBackspace, onSpace, onDirectInput }: KeyboardProps) {
    const keyboardRef = useRef<HTMLDivElement>(null);
    const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [mode, setMode] = useState<KeyboardMode>('letters');
    const [capsLock, setCapsLock] = useState(false);

    const ROWS = mode === 'letters' ? LETTERS : NUMBERS;

    // Calculate key centers
    useEffect(() => {
        const calculateLayout = () => {
            if (!keyboardRef.current) return;
            const keyboardRect = keyboardRef.current.getBoundingClientRect();
            const newKeyMap: KeyCoordinate[] = [];

            keyRefs.current.forEach((el, char) => {
                const rect = el.getBoundingClientRect();
                const x = rect.left - keyboardRect.left + rect.width / 2;
                const y = rect.top - keyboardRect.top + rect.height / 2;
                newKeyMap.push({ char: char.toLowerCase(), x, y });
            });

            onLayoutReady(newKeyMap);
        };

        const timer = setTimeout(calculateLayout, 100);
        window.addEventListener('resize', calculateLayout);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateLayout);
        };
    }, [onLayoutReady, mode]);

    // Physical keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if (e.key === 'Backspace') {
                e.preventDefault();
                onBackspace();
                setActiveKey('backspace');
                setTimeout(() => setActiveKey(null), 100);
                return;
            }

            if (e.key === ' ') {
                e.preventDefault();
                onSpace();
                setActiveKey('space');
                setTimeout(() => setActiveKey(null), 100);
                return;
            }

            if (e.key === 'CapsLock') {
                setCapsLock(prev => !prev);
                return;
            }

            const allKeys = LETTERS.flat();
            if (allKeys.includes(key)) {
                e.preventDefault();
                setActiveKey(key);
                setTimeout(() => setActiveKey(null), 100);

                const outputChar = capsLock || e.shiftKey ? key.toUpperCase() : key;
                onDirectInput(outputChar);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBackspace, onSpace, onDirectInput, capsLock]);

    const handleKeyClick = useCallback((char: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setActiveKey(char);
        setTimeout(() => setActiveKey(null), 100);

        // For letters, always use onDirectInput with proper case
        if (mode === 'letters') {
            const outputChar = capsLock ? char.toUpperCase() : char.toLowerCase();
            onDirectInput(outputChar);
            return;
        }

        // For numbers/symbols, use onDirectInput directly
        onDirectInput(char);
    }, [onDirectInput, mode, capsLock]);

    const toggleMode = () => {
        setMode(prev => prev === 'letters' ? 'numbers' : 'letters');
    };

    const toggleCaps = () => {
        setCapsLock(prev => !prev);
    };

    const keyStyle = (char: string): React.CSSProperties => ({
        width: '40px',
        height: '42px',
        borderRadius: '5px',
        border: 'none',
        fontSize: mode === 'letters' ? '20px' : '18px',
        fontWeight: 400,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.05s',
        backgroundColor: activeKey === char ? '#84cc16' : '#525357',
        color: activeKey === char ? '#000' : '#fff',
        boxShadow: '0 1px 0 #2c2c2e',
        transform: activeKey === char ? 'scale(0.95)' : 'scale(1)',
        textTransform: mode === 'letters' && capsLock ? 'uppercase' : 'none',
    });

    const fnKeyStyle = (active: boolean = false): React.CSSProperties => ({
        height: '42px',
        borderRadius: '5px',
        border: 'none',
        fontSize: '15px',
        fontWeight: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        cursor: 'pointer',
        backgroundColor: active ? '#fff' : '#3a3a3c',
        color: active ? '#000' : '#fff',
        boxShadow: '0 1px 0 #2c2c2e',
    });

    return (
        <div
            ref={keyboardRef}
            style={{
                width: '100%',
                maxWidth: '480px',
                margin: '0 auto',
                background: '#2c2c2e',
                borderRadius: '10px',
                padding: '6px 3px 10px 3px',
            }}
        >
            {/* Hint */}
            <div style={{
                textAlign: 'center',
                fontSize: '11px',
                color: '#777',
                marginBottom: '8px',
            }}>
                💡 Type on keyboard or tap keys
            </div>

            {/* Keyboard rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Row 1 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    {ROWS[0].map((char) => (
                        <button
                            key={char}
                            ref={el => { if (el) keyRefs.current.set(char, el); }}
                            onClick={(e) => handleKeyClick(char, e)}
                            style={keyStyle(char)}
                        >
                            {mode === 'letters' && capsLock ? char.toUpperCase() : char}
                        </button>
                    ))}
                </div>

                {/* Row 2 (indented) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', padding: '0 18px' }}>
                    {ROWS[1].map((char) => (
                        <button
                            key={char}
                            ref={el => { if (el) keyRefs.current.set(char, el); }}
                            onClick={(e) => handleKeyClick(char, e)}
                            style={keyStyle(char)}
                        >
                            {mode === 'letters' && capsLock ? char.toUpperCase() : char}
                        </button>
                    ))}
                </div>

                {/* Row 3: shift + keys + backspace */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    {mode === 'letters' ? (
                        <button onClick={toggleCaps} style={{ ...fnKeyStyle(capsLock), width: '46px' }}>
                            ⇧
                        </button>
                    ) : (
                        <button onClick={toggleMode} style={{ ...fnKeyStyle(), width: '46px', fontSize: '13px' }}>
                            ABC
                        </button>
                    )}

                    {ROWS[2].map((char) => (
                        <button
                            key={char}
                            ref={el => { if (el) keyRefs.current.set(char, el); }}
                            onClick={(e) => handleKeyClick(char, e)}
                            style={keyStyle(char)}
                        >
                            {mode === 'letters' && capsLock ? char.toUpperCase() : char}
                        </button>
                    ))}

                    <button
                        onClick={(e) => { e.stopPropagation(); onBackspace(); setActiveKey('backspace'); setTimeout(() => setActiveKey(null), 100); }}
                        style={{ ...fnKeyStyle(activeKey === 'backspace'), width: '46px' }}
                    >
                        ⌫
                    </button>
                </div>

                {/* Row 4: 123/ABC + globe + space + return */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
                    <button onClick={toggleMode} style={{ ...fnKeyStyle(mode === 'numbers'), width: '46px', fontSize: '15px' }}>
                        {mode === 'letters' ? '123' : 'ABC'}
                    </button>

                    <button style={{ ...fnKeyStyle(), width: '38px', fontSize: '18px' }}>
                        🌐
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onSpace(); setActiveKey('space'); setTimeout(() => setActiveKey(null), 100); }}
                        style={{
                            flex: 1,
                            maxWidth: '200px',
                            height: '42px',
                            borderRadius: '5px',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            backgroundColor: activeKey === 'space' ? '#84cc16' : '#525357',
                            color: activeKey === 'space' ? '#000' : '#fff',
                            boxShadow: '0 1px 0 #2c2c2e',
                        }}
                    >
                        space
                    </button>

                    <button style={{ ...fnKeyStyle(), width: '80px', fontSize: '14px' }}>
                        return
                    </button>
                </div>
            </div>
        </div>
    );
}
