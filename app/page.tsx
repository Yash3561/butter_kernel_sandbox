'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trie, TapEvent, Candidate, KeyCoordinate } from '@/lib/Trie';
import { LanguageModel, RankedCandidate } from '@/lib/LanguageModel';
import Keyboard from '@/components/Keyboard';
import EngineTrace from '@/components/EngineTrace';
import MetricsSidebar from '@/components/MetricsSidebar';
import IPhonePreview from '@/components/IPhonePreview';

export default function Home() {
  const [trie, setTrie] = useState<Trie | null>(null);
  const [languageModel, setLanguageModel] = useState<LanguageModel | null>(null);
  const [keyMap, setKeyMap] = useState<KeyCoordinate[]>([]);
  const [taps, setTaps] = useState<TapEvent[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [inputText, setInputText] = useState<string>("");

  // Real latency tracking
  const [pass1Latency, setPass1Latency] = useState<number>(0);
  const [pass2Latency, setPass2Latency] = useState<number>(0);
  const [totalLatency, setTotalLatency] = useState<number>(0);
  const [pass2Skipped, setPass2Skipped] = useState<boolean>(false);

  // Initialize Trie and LanguageModel on mount
  useEffect(() => {
    const t = new Trie();
    const lm = new LanguageModel();
    setTrie(t);
    setLanguageModel(lm);
    console.log('[ButterKernel] Trie and LanguageModel initialized');
  }, []);

  const handleLayoutReady = useCallback((map: KeyCoordinate[]) => {
    setKeyMap(map);
  }, []);

  // Get previous word for context
  const getPreviousWord = useCallback((): string | null => {
    const words = inputText.trim().split(' ');
    if (words.length >= 2) {
      return words[words.length - 2];
    }
    return null;
  }, [inputText]);

  // Handle virtual keyboard tap (spatial detection)
  const handleTap = useCallback((tap: TapEvent) => {
    if (!trie || !languageModel || keyMap.length === 0) return;

    // PASS 1: Trie + Spatial Weighting (REAL TIMING)
    const pass1Start = performance.now();

    // Find the closest key for display
    let closestChar = '';
    let minDistance = Infinity;
    for (const key of keyMap) {
      const dist = Math.sqrt(Math.pow(tap.x - key.x, 2) + Math.pow(tap.y - key.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestChar = key.char;
      }
    }

    const newTaps = [...taps, tap];
    setTaps(newTaps);
    setInputText(prev => prev + closestChar);

    // Run the spatial weighting engine
    const spatialResults = trie.searchWithSpatialWeighting(newTaps, keyMap);

    const pass1End = performance.now();
    const pass1Time = pass1End - pass1Start;
    setPass1Latency(pass1Time);

    // Check confidence for skip optimization
    const topConfidence = spatialResults.length > 0 ? spatialResults[0].finalRank : 0;
    const shouldSkipPass2 = topConfidence > 15 && spatialResults.length === 1;

    if (shouldSkipPass2) {
      // HIGH CONFIDENCE - Skip Pass 2
      setPass2Skipped(true);
      setPass2Latency(0);
      setTotalLatency(pass1Time);
      setCandidates(spatialResults);
      console.log(`[ButterKernel] Pass 2 SKIPPED (confidence: ${topConfidence.toFixed(1)})`);
    } else {
      // PASS 2: Language Model Ranking (REAL COMPUTATION)
      const pass2Start = performance.now();

      const previousWord = getPreviousWord();
      const rankedResults = languageModel.rankCandidates(spatialResults, previousWord);

      // Convert back to Candidate format
      const finalCandidates: Candidate[] = rankedResults.map((rc, index) => {
        const original = spatialResults.find(c => c.word === rc.word);
        return {
          word: rc.word,
          prefixMatch: original?.prefixMatch || '',
          spatialScore: original?.spatialScore || 0,
          frequency: original?.frequency || 0,
          finalRank: rc.combinedScore, // Now using LM-enhanced score
        };
      });

      const pass2End = performance.now();
      const pass2Time = pass2End - pass2Start;

      setPass2Skipped(false);
      setPass2Latency(pass2Time);
      setTotalLatency(pass1Time + pass2Time);
      setCandidates(finalCandidates);

      console.log(`[ButterKernel] Pass 1: ${pass1Time.toFixed(2)}ms | Pass 2 (LM): ${pass2Time.toFixed(2)}ms | Total: ${(pass1Time + pass2Time).toFixed(2)}ms`);
    }

  }, [trie, languageModel, keyMap, taps, getPreviousWord]);

  // Handle physical keyboard (direct input)
  const handleDirectInput = useCallback((char: string) => {
    if (!trie || !languageModel) return;

    const pass1Start = performance.now();

    setInputText(prev => prev + char.toLowerCase());

    const keyCoord = keyMap.find(k => k.char === char.toLowerCase());
    if (keyCoord) {
      const tap: TapEvent = { x: keyCoord.x, y: keyCoord.y, timestamp: Date.now() };
      const newTaps = [...taps, tap];
      setTaps(newTaps);

      const spatialResults = trie.searchWithSpatialWeighting(newTaps, keyMap);

      const pass1End = performance.now();
      const pass1Time = pass1End - pass1Start;
      setPass1Latency(pass1Time);

      // Pass 2: Language Model
      const pass2Start = performance.now();
      const previousWord = getPreviousWord();
      const rankedResults = languageModel.rankCandidates(spatialResults, previousWord);

      const finalCandidates: Candidate[] = rankedResults.map(rc => {
        const original = spatialResults.find(c => c.word === rc.word);
        return {
          word: rc.word,
          prefixMatch: original?.prefixMatch || '',
          spatialScore: original?.spatialScore || 0,
          frequency: original?.frequency || 0,
          finalRank: rc.combinedScore,
        };
      });

      const pass2End = performance.now();
      const pass2Time = pass2End - pass2Start;

      setPass2Skipped(false);
      setPass2Latency(pass2Time);
      setTotalLatency(pass1Time + pass2Time);
      setCandidates(finalCandidates);
    }
  }, [trie, languageModel, keyMap, taps, getPreviousWord]);

  const handleBackspace = useCallback(() => {
    setInputText(prev => prev.slice(0, -1));
    const newTaps = taps.slice(0, -1);
    setTaps(newTaps);

    if (trie && keyMap.length > 0 && newTaps.length > 0) {
      const results = trie.searchWithSpatialWeighting(newTaps, keyMap);
      setCandidates(results);
    } else {
      setCandidates([]);
    }
  }, [trie, keyMap, taps]);

  const handleSpace = useCallback(() => {
    const currentWord = inputText.split(' ').pop() || '';
    const wordToAccept = candidates.length > 0 ? candidates[0].word : currentWord;

    const words = inputText.split(' ');
    words[words.length - 1] = wordToAccept;
    setInputText(words.join(' ') + ' ');

    setTaps([]);
    setCandidates([]);
  }, [candidates, inputText]);

  const handleReset = () => {
    setTaps([]);
    setInputText("");
    setCandidates([]);
    setPass1Latency(0);
    setPass2Latency(0);
    setTotalLatency(0);
    setPass2Skipped(false);
  };

  return (
    <main style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr 280px',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* LEFT PANEL: ENGINE TRACE */}
      <div style={{
        height: '100%',
        borderRight: '1px solid #1a1a1a',
        backgroundColor: '#0a0a0a',
        overflow: 'auto',
      }}>
        <EngineTrace candidates={candidates} />
      </div>

      {/* CENTER PANEL: WORKSPACE */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
      }}>
        <header style={{
          padding: '12px 20px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              BUTTER<span style={{ color: '#84cc16' }}>KERNEL</span>
            </h1>
            <span style={{
              fontSize: '9px',
              padding: '3px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(132, 204, 22, 0.15)',
              color: '#84cc16',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}>ENGINE SANDBOX</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live Latency Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: totalLatency > 15 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${totalLatency > 15 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              borderRadius: '6px',
            }}>
              <span style={{ fontSize: '10px', color: '#888' }}>LATENCY</span>
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: totalLatency > 15 ? '#ef4444' : '#22c55e',
              }}>
                {totalLatency.toFixed(1)}ms
              </span>
              <span style={{ fontSize: '10px', color: '#555' }}>/ 30ms</span>
            </div>

            {pass2Skipped && (
              <span style={{
                fontSize: '9px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontWeight: 600,
              }}>⚡ PASS 2 SKIPPED</span>
            )}

            <button
              onClick={handleReset}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#888',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              RESET
            </button>
          </div>
        </header>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          gap: '20px',
        }}>
          <IPhonePreview
            input={inputText}
            suggestion={candidates.length > 0 ? candidates[0].word : ""}
          />

          <div style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: '#555',
              marginBottom: '8px',
              padding: '0 4px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}>
              <span>⌨️ Tap Surface (Spatial Input)</span>
              <span style={{ color: '#666' }}>Physical Keyboard Enabled</span>
            </div>
            <Keyboard
              onTap={handleTap}
              onLayoutReady={handleLayoutReady}
              onBackspace={handleBackspace}
              onSpace={handleSpace}
              onDirectInput={handleDirectInput}
            />
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          fontSize: '10px',
          color: '#555',
          backgroundColor: '#080808',
        }}>
          <span>Pass 1 (Trie+Spatial): <span style={{ color: '#84cc16' }}>{pass1Latency.toFixed(2)}ms</span></span>
          <span>Pass 2 (N-gram LM): <span style={{ color: pass2Skipped ? '#555' : '#f59e0b' }}>{pass2Skipped ? 'SKIPPED' : `${pass2Latency.toFixed(2)}ms`}</span></span>
          <span>Context: <span style={{ color: '#fff' }}>{getPreviousWord() || '(start)'}</span></span>
        </div>
      </div>

      {/* RIGHT PANEL: METRICS */}
      <div style={{
        height: '100%',
        borderLeft: '1px solid #1a1a1a',
        backgroundColor: '#0a0a0a',
        overflow: 'auto',
      }}>
        <MetricsSidebar
          latency={totalLatency}
          pass1Latency={pass1Latency}
          pass2Latency={pass2Latency}
          candidates={candidates}
          tapCount={taps.length}
        />
      </div>
    </main>
  );
}
