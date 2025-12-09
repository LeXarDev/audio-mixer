import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import MicrophonePanel from './components/MicrophonePanel';
import EffectsPanel from './components/EffectsPanel';
import PluginsPanel from './components/PluginsPanel';
import PresetsPanel from './components/PresetsPanel';
import Visualizer from './components/Visualizer';
import { AudioEngine } from './audio/AudioEngine';
import {
    Volume2, VolumeX, AlertTriangle, Check, Loader, Headphones,
    Zap, Save, Plug
} from 'lucide-react';

function App() {
    const [activePanel, setActivePanel] = useState('effects');
    const [audioEngine, setAudioEngine] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [devices, setDevices] = useState({ inputs: [], outputs: [] });
    const [selectedInput, setSelectedInput] = useState('');
    const [vbCableStatus, setVbCableStatus] = useState('checking'); // 'checking', 'found', 'not-found'
    const [showVbCableAlert, setShowVbCableAlert] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);

    const [settings, setSettings] = useState({
        gain: 0,
        outputVolume: 100,
        muted: false,
        highpass: { frequency: 80, enabled: false },
        eq: { low: 0, mid: 0, high: 0, enabled: true },
        deesser: { frequency: 6000, reduction: 6, enabled: false },
        compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, enabled: false },
        multibandCompressor: {
            low: { threshold: -24, ratio: 3 },
            mid: { threshold: -24, ratio: 3 },
            high: { threshold: -24, ratio: 3 },
            enabled: false
        },
        gate: { threshold: -50, enabled: false },
        reverb: { wet: 0.3, enabled: false },
        limiter: { threshold: -1, enabled: false },
        rnnoise: { enabled: false, strength: 80 }
    });

    // Find VB-Cable in output devices
    const findVbCable = useCallback((outputs) => {
        const vbCable = outputs.find(d =>
            d.label.toLowerCase().includes('cable input') ||
            d.label.toLowerCase().includes('vb-audio') ||
            d.label.toLowerCase().includes('virtual cable')
        );
        return vbCable;
    }, []);

    // Initialize audio engine
    useEffect(() => {
        const engine = new AudioEngine();
        setAudioEngine(engine);

        const initAudio = async () => {
            const devs = await engine.getDevices();
            setDevices(devs);

            // Select first microphone
            let inputId = '';
            if (devs.inputs.length > 0) {
                inputId = devs.inputs[0].deviceId;
                setSelectedInput(inputId);
            }

            // Check for VB-Cable
            const vbCable = findVbCable(devs.outputs);
            if (vbCable) {
                setVbCableStatus('found');

                // Auto-start with VB-Cable as output
                if (inputId) {
                    const started = await engine.start(inputId, vbCable.deviceId, settings);
                    if (started) {
                        setIsRunning(true);
                    }
                }
            } else {
                setVbCableStatus('not-found');
                setShowVbCableAlert(true);

                // Start without output (monitoring only)
                if (inputId) {
                    const started = await engine.start(inputId, null, settings);
                    if (started) {
                        setIsRunning(true);
                    }
                }
            }
        };

        initAudio();

        // Device change callback
        engine.setDeviceChangeCallback((newDevices) => {
            setDevices(newDevices);
            const vbCable = findVbCable(newDevices.outputs);
            if (vbCable) {
                setVbCableStatus('found');
                setShowVbCableAlert(false);
            }
        });

        return () => engine.stop();
    }, []);

    // Handle microphone change
    const handleInputChange = async (deviceId) => {
        setSelectedInput(deviceId);
        if (audioEngine) {
            const wasMonitoring = isMonitoring;
            audioEngine.stop();
            const vbCable = findVbCable(devices.outputs);
            await audioEngine.start(deviceId, vbCable?.deviceId || null, settings);
            setIsRunning(true);
            // Restore monitoring state
            if (wasMonitoring) {
                audioEngine.setMonitoring(true);
            }
        }
    };

    // Update settings
    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (audioEngine) {
            audioEngine.updateSettings(newSettings);
        }
    };

    return (
        <div className="app">
            <TitleBar />

            {/* VB-Cable Alert */}
            {showVbCableAlert && (
                <div className="vb-cable-alert">
                    <div className="alert-content">
                        <span className="alert-icon"><AlertTriangle size={20} /></span>
                        <div className="alert-text">
                            <strong>VB-Cable Not Installed!</strong>
                            <p>To route audio to other apps, install VB-Audio Virtual Cable.</p>
                            <a href="https://vb-audio.com/Cable/" target="_blank" rel="noopener noreferrer">
                                Download VB-Cable (Free)
                            </a>
                        </div>
                        <button onClick={() => setShowVbCableAlert(false)} className="alert-close">×</button>
                    </div>
                </div>
            )}

            <div className="main-content">
                {/* Left Panel */}
                <div className="side-panel">
                    <MicrophonePanel
                        devices={devices.inputs}
                        selected={selectedInput}
                        onSelect={handleInputChange}
                        gain={settings.gain}
                        onGainChange={(v) => updateSetting('gain', v)}
                        isRunning={isRunning}
                    />

                    {/* Output Status (Read-only) */}
                    <div className="panel output-panel">
                        <div className="panel-header">
                            <span className="panel-icon"><Volume2 size={16} /></span>
                            <span className="panel-title">OUTPUT</span>
                        </div>
                        <div className="panel-content">
                            <div className="output-status">
                                <div className={`status-badge ${vbCableStatus}`}>
                                    {vbCableStatus === 'found' && <><Check size={12} /> VB-Cable</>}
                                    {vbCableStatus === 'not-found' && <><AlertTriangle size={12} /> VB-Cable Not Found</>}
                                    {vbCableStatus === 'checking' && <><Loader size={12} className="spin" /> Searching...</>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Volume <span className="value">{settings.outputVolume}%</span></label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={settings.outputVolume}
                                    onChange={(e) => updateSetting('outputVolume', parseInt(e.target.value))}
                                    className="slider"
                                />
                            </div>

                            <button
                                className={`mute-btn ${settings.muted ? 'muted' : ''}`}
                                onClick={() => updateSetting('muted', !settings.muted)}
                            >
                                {settings.muted ? <><VolumeX size={14} /> MUTED</> : <><Volume2 size={14} /> ACTIVE</>}
                            </button>

                            <button
                                className={`monitor-btn ${isMonitoring ? 'active' : ''}`}
                                onClick={() => {
                                    const newState = !isMonitoring;
                                    setIsMonitoring(newState);
                                    if (audioEngine) {
                                        audioEngine.setMonitoring(newState);
                                    }
                                }}
                            >
                                <Headphones size={14} /> {isMonitoring ? 'Monitor ON' : 'Monitor OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className={`status-indicator ${isRunning ? 'active' : ''}`}>
                        <span className="status-dot"></span>
                        <span>{isRunning ? 'Processing Audio' : 'Waiting for Mic...'}</span>
                    </div>
                </div>

                {/* Center - Visualizer */}
                <div className="center-panel">
                    <Visualizer audioEngine={audioEngine} isRunning={isRunning} />
                </div>

                {/* Right Panel - Effects & Plugins */}
                <div className="right-panel">
                    <div className="panel-tabs">
                        <button
                            className={`panel-tab ${activePanel === 'effects' ? 'active' : ''}`}
                            onClick={() => setActivePanel('effects')}
                        >
                            <Zap size={14} /> Effects
                        </button>
                        <button
                            className={`panel-tab ${activePanel === 'presets' ? 'active' : ''}`}
                            onClick={() => setActivePanel('presets')}
                        >
                            <Save size={14} /> Presets
                        </button>
                        <button
                            className={`panel-tab ${activePanel === 'plugins' ? 'active' : ''}`}
                            onClick={() => setActivePanel('plugins')}
                        >
                            <Plug size={14} /> Plugins
                        </button>
                    </div>

                    <div className="panel-content-area">
                        {activePanel === 'effects' && (
                            <EffectsPanel
                                settings={settings}
                                onSettingChange={updateSetting}
                            />
                        )}
                        {activePanel === 'presets' && (
                            <PresetsPanel
                                settings={settings}
                                onLoadPreset={(newSettings) => {
                                    setSettings(prev => ({ ...prev, ...newSettings, outputVolume: prev.outputVolume, muted: prev.muted }));
                                    if (audioEngine) {
                                        audioEngine.updateSettings({ ...settings, ...newSettings });
                                    }
                                }}
                                onSettingChange={updateSetting}
                            />
                        )}
                        {activePanel === 'plugins' && (
                            <PluginsPanel
                                settings={settings}
                                onSettingChange={updateSetting}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
