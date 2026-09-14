import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, RefreshCw, Zap, Sparkles, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CyberAuthGameProps {
  onVerified?: () => void;
  onBypass?: () => void;
  isVerificationGate?: boolean;
}

// 9 Futuristic Neural Nodes in a 3x3 Matrix
const NODES = [
  { id: 0, label: 'N-01', code: 'ALPHA', freq: 330 },
  { id: 1, label: 'N-02', code: 'BETA', freq: 392 },
  { id: 2, label: 'N-03', code: 'GAMMA', freq: 440 },
  { id: 3, label: 'N-04', code: 'DELTA', freq: 494 },
  { id: 4, label: 'N-05', code: 'OMEGA', freq: 523 },
  { id: 5, label: 'N-06', code: 'SIGMA', freq: 587 },
  { id: 6, label: 'N-07', code: 'EPSILON', freq: 659 },
  { id: 7, label: 'N-08', code: 'ZETA', freq: 740 },
  { id: 8, label: 'N-09', code: 'THETA', freq: 880 },
];

export const CyberAuthGame: React.FC<CyberAuthGameProps> = ({
  onVerified,
  onBypass,
  isVerificationGate = true,
}) => {
  // Game States: 'idle' | 'showing' | 'user_turn' | 'success' | 'failed'
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'user_turn' | 'success' | 'failed'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('examora_cipher_highscore') || '0', 10);
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Initiate Neural Sync to verify human intelligence.');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio synthesis helper (zero dependency Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration = 0.22) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Generate sequence based on level (level 1 = 3 nodes, level 2 = 4 nodes, etc.)
  const startNewRound = useCallback((targetLevel: number) => {
    const sequenceLength = isVerificationGate ? 3 : Math.min(3 + targetLevel - 1, 8);
    const newSeq: number[] = [];
    for (let i = 0; i < sequenceLength; i++) {
      newSeq.push(Math.floor(Math.random() * NODES.length));
    }

    setSequence(newSeq);
    setUserStep(0);
    setGameState('showing');
    setFeedbackMessage(isVerificationGate 
      ? 'Memorize Neural Sequence...' 
      : `Level ${targetLevel}: Memorize ${sequenceLength} node pulse sequence.`
    );
  }, [isVerificationGate]);

  // Playback the sequence to user with glowing visual pulse
  useEffect(() => {
    if (gameState !== 'showing' || sequence.length === 0) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < sequence.length) {
        const nodeId = sequence[index];
        setActiveNode(nodeId);
        playTone(NODES[nodeId].freq, 'sine', 0.25);

        // Turn off light after 380ms
        setTimeout(() => {
          setActiveNode(null);
        }, 380);

        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setGameState('user_turn');
          setFeedbackMessage('Your turn: Replicate the neural sequence.');
        }, 400);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [gameState, sequence, playTone]);

  // Handle User Node Click
  const handleNodeClick = (nodeId: number) => {
    if (gameState !== 'user_turn') return;

    // Visual & audio feedback
    setActiveNode(nodeId);
    playTone(NODES[nodeId].freq, 'triangle', 0.18);
    setTimeout(() => setActiveNode(null), 200);

    const expectedNode = sequence[userStep];

    if (nodeId === expectedNode) {
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      // Successfully completed the sequence!
      if (nextStep === sequence.length) {
        setGameState('success');
        setFeedbackMessage('✓ Biometric Neural Pattern Verified (100%)');
        
        // Success audio fanfare
        playTone(523, 'sine', 0.1);
        setTimeout(() => playTone(659, 'sine', 0.1), 100);
        setTimeout(() => playTone(784, 'sine', 0.15), 200);
        setTimeout(() => playTone(1046, 'sine', 0.35), 300);

        // Confetti celebration
        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B']
          });
        } catch {
          // ignore
        }

        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > highScore) {
          setHighScore(newStreak);
          localStorage.setItem('examora_cipher_highscore', newStreak.toString());
        }

        if (isVerificationGate) {
          setTimeout(() => {
            if (onVerified) onVerified();
          }, 800);
        } else {
          // Arcade mode progression
          setTimeout(() => {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            startNewRound(nextLevel);
          }, 1200);
        }
      }
    } else {
      // Mistake made
      setGameState('failed');
      setStreak(0);
      setFeedbackMessage('✕ Pattern Desync! Decryption signature rejected.');
      playTone(130, 'sawtooth', 0.4);

      setTimeout(() => {
        setGameState('idle');
        setFeedbackMessage('Tap "Start Neural Sync" to generate a fresh cipher.');
      }, 1600);
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      borderRadius: '20px',
      padding: '1.5rem',
      color: '#FFFFFF',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 25px rgba(99, 102, 241, 0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '140px',
        height: '140px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Cpu size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Neural Security Matrix</span>
              <span style={{
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818CF8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 600
              }}>
                {isVerificationGate ? 'HUMAN GATE' : 'ARCADE'}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              Cognitive integrity verification protocol
            </div>
          </div>
        </div>

        {/* Stats & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isVerificationGate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.72rem',
              color: '#CBD5E1'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={13} color="#F59E0B" />
                Streak: <strong>{streak}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trophy size={13} color="#10B981" />
                Best: <strong>{highScore}</strong>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: soundEnabled ? '#06B6D4' : '#64748B',
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? '🔊 Sound On' : '🔇 Mute'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: gameState === 'success'
          ? 'rgba(16, 185, 129, 0.15)'
          : gameState === 'failed'
          ? 'rgba(239, 68, 68, 0.15)'
          : gameState === 'showing'
          ? 'rgba(6, 182, 212, 0.15)'
          : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${
          gameState === 'success'
            ? 'rgba(16, 185, 129, 0.4)'
            : gameState === 'failed'
            ? 'rgba(239, 68, 68, 0.4)'
            : gameState === 'showing'
            ? 'rgba(6, 182, 212, 0.4)'
            : 'rgba(255, 255, 255, 0.08)'
        }`,
        color: gameState === 'success' ? '#6EE7B7' : gameState === 'failed' ? '#FCA5A5' : '#E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {gameState === 'success' ? (
            <ShieldCheck size={14} color="#10B981" />
          ) : gameState === 'failed' ? (
            <ShieldAlert size={14} color="#EF4444" />
          ) : (
            <Zap size={14} color="#06B6D4" />
          )}
          <span>{feedbackMessage}</span>
        </div>

        {gameState === 'user_turn' && (
          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
            Progress: {userStep}/{sequence.length}
          </span>
        )}
      </div>

      {/* 3x3 Cyber Node Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        maxWidth: '300px',
        margin: '0 auto 1.25rem auto'
      }}>
        {NODES.map((node) => {
          const isActive = activeNode === node.id;
          return (
            <button
              key={node.id}
              type="button"
              disabled={gameState === 'showing' || gameState === 'success'}
              onClick={() => handleNodeClick(node.id)}
              style={{
                height: '76px',
                borderRadius: '12px',
                border: isActive
                  ? '2px solid #06B6D4'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(6, 182, 212, 0.9) 100%)'
                  : 'rgba(30, 41, 59, 0.6)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: gameState === 'showing' || gameState === 'success' ? 'not-allowed' : 'pointer',
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                boxShadow: isActive
                  ? '0 0 25px rgba(6, 182, 212, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.4)'
                  : '0 2px 6px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.14s ease',
                userSelect: 'none',
              }}
            >
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: isActive ? '#FFFFFF' : '#E2E8F0'
              }}>
                {node.label}
              </span>
              <span style={{
                fontSize: '0.58rem',
                letterSpacing: '0.06em',
                color: isActive ? '#CFFAFE' : '#64748B',
                fontWeight: 600
              }}>
                {node.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {gameState === 'idle' || gameState === 'failed' ? (
          <button
            type="button"
            onClick={() => startNewRound(level)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Sparkles size={14} />
            <span>{gameState === 'failed' ? 'Retry Cipher' : 'Start Neural Sync'}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={gameState === 'showing'}
            onClick={() => startNewRound(level)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#CBD5E1',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: gameState === 'showing' ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={12} />
            <span>Restart</span>
          </button>
        )}

        {/* Skip / Bypass Verification button for effortless instant entry */}
        {isVerificationGate && onBypass && (
          <button
            type="button"
            onClick={onBypass}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              background: 'rgba(6, 182, 212, 0.08)',
              color: '#67E8F9',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            title="Bypass game verification and proceed immediately"
          >
            <Zap size={13} />
            <span>Instant Bypass</span>
          </button>
        )}
      </div>
    </div>
  );
};
