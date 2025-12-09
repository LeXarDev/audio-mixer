import React, { useRef, useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';

function Visualizer({ audioEngine, isRunning }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [level, setLevel] = useState(0);
    const [peakLevel, setPeakLevel] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let peakHold = 0;
        let peakDecay = 0;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas with fade effect
            ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
            ctx.fillRect(0, 0, width, height);

            if (isRunning && audioEngine) {
                const data = audioEngine.getAnalyserData();

                if (data && data.length > 0) {
                    // Calculate level for VU meter
                    let sum = 0;
                    for (let i = 0; i < data.length; i++) {
                        sum += data[i];
                    }
                    const currentLevel = sum / data.length / 255;
                    setLevel(currentLevel);

                    // Peak hold
                    if (currentLevel > peakHold) {
                        peakHold = currentLevel;
                        peakDecay = 0;
                    } else {
                        peakDecay++;
                        if (peakDecay > 30) {
                            peakHold = Math.max(0, peakHold - 0.02);
                        }
                    }
                    setPeakLevel(peakHold);

                    // Draw spectrum bars
                    const barCount = Math.min(64, data.length);
                    const barWidth = width / barCount;
                    const gradient = ctx.createLinearGradient(0, height, 0, 0);
                    gradient.addColorStop(0, '#6366f1');
                    gradient.addColorStop(0.5, '#8b5cf6');
                    gradient.addColorStop(1, '#ec4899');

                    for (let i = 0; i < barCount; i++) {
                        const dataIndex = Math.floor(i * data.length / barCount);
                        const barHeight = (data[dataIndex] / 255) * height * 0.85;
                        const x = i * barWidth;

                        // Main bar
                        ctx.fillStyle = gradient;
                        ctx.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);

                        // Glow effect
                        ctx.fillStyle = `rgba(139, 92, 246, ${data[dataIndex] / 255 * 0.3})`;
                        ctx.fillRect(x + 1, height - barHeight - 5, barWidth - 2, 5);
                    }
                }
            } else {
                // Idle animation
                setLevel(0);
                setPeakLevel(0);
                const time = Date.now() / 1000;
                const bars = 64;
                const barWidth = width / bars;

                for (let i = 0; i < bars; i++) {
                    const barHeight = Math.sin(time * 2 + i * 0.2) * 15 + 25;
                    const alpha = 0.2 + Math.sin(time + i * 0.1) * 0.1;
                    ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
                    ctx.fillRect(i * barWidth + 1, height / 2 - barHeight / 2, barWidth - 2, barHeight);
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioEngine, isRunning]);

    // Convert level to dB
    const levelDB = level > 0 ? Math.round(20 * Math.log10(level)) : -60;
    const displayDB = levelDB > -60 ? `${levelDB}dB` : '--';

    return (
        <div className="visualizer">
            <div className="visualizer-header">
                <span><BarChart2 size={14} /> SPECTRUM ANALYZER</span>
                <div className="vu-meter">
                    <div className="vu-label">VU</div>
                    <div className="vu-bar">
                        <div
                            className="vu-fill"
                            style={{
                                width: `${Math.min(100, level * 150)}%`,
                                background: level > 0.7 ? 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)' : undefined
                            }}
                        />
                        {peakLevel > 0 && (
                            <div
                                className="vu-peak"
                                style={{ left: `${Math.min(100, peakLevel * 150)}%` }}
                            />
                        )}
                    </div>
                    <span className="vu-value">{displayDB}</span>
                </div>
            </div>
            <canvas ref={canvasRef} width={600} height={200} className="spectrum-canvas" />

            <div className="effects-chain">
                <span className="chain-label">SIGNAL CHAIN:</span>
                <div className="chain-flow">
                    <span className={`chain-node ${isRunning ? 'active' : ''}`}>MIC</span>
                    <span className="chain-arrow">→</span>
                    <span className="chain-node">GAIN</span>
                    <span className="chain-arrow">→</span>
                    <span className="chain-node">EQ</span>
                    <span className="chain-arrow">→</span>
                    <span className="chain-node">COMP</span>
                    <span className="chain-arrow">→</span>
                    <span className={`chain-node ${isRunning ? 'active' : ''}`}>OUT</span>
                </div>
            </div>
        </div>
    );
}

export default Visualizer;
