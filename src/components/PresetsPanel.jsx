import React, { useState, useEffect } from 'react';
import { Save, Star, Folder, Mic, Headphones, Gamepad2, Music, VolumeX, Trash2, Plus, Info } from 'lucide-react';

// Default presets
const defaultPresets = [
    {
        name: 'Radio Voice',
        icon: 'mic',
        settings: {
            gain: 3,
            highpass: { frequency: 80, enabled: true },
            eq: { low: -2, mid: 2, high: 3, enabled: true },
            deesser: { frequency: 6500, reduction: 6, enabled: true },
            compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25, enabled: true },
            multibandCompressor: { low: { threshold: -24, ratio: 3 }, mid: { threshold: -24, ratio: 3 }, high: { threshold: -24, ratio: 3 }, enabled: false },
            gate: { threshold: -45, enabled: true },
            reverb: { wet: 0.1, enabled: false },
            limiter: { threshold: -1, enabled: true },
            rnnoise: { enabled: false, strength: 80 }
        }
    },
    {
        name: 'Podcast',
        icon: 'headphones',
        settings: {
            gain: 0,
            highpass: { frequency: 100, enabled: true },
            eq: { low: 0, mid: 1, high: 1, enabled: true },
            deesser: { frequency: 6000, reduction: 4, enabled: true },
            compressor: { threshold: -24, ratio: 3, attack: 0.005, release: 0.25, enabled: true },
            multibandCompressor: { low: { threshold: -24, ratio: 3 }, mid: { threshold: -24, ratio: 3 }, high: { threshold: -24, ratio: 3 }, enabled: false },
            gate: { threshold: -50, enabled: true },
            reverb: { wet: 0, enabled: false },
            limiter: { threshold: -2, enabled: true },
            rnnoise: { enabled: true, strength: 80 }
        }
    },
    {
        name: 'Gaming',
        icon: 'gamepad',
        settings: {
            gain: 0,
            highpass: { frequency: 120, enabled: true },
            eq: { low: -1, mid: 2, high: 2, enabled: true },
            deesser: { frequency: 6000, reduction: 3, enabled: false },
            compressor: { threshold: -20, ratio: 5, attack: 0.002, release: 0.15, enabled: true },
            multibandCompressor: { low: { threshold: -24, ratio: 3 }, mid: { threshold: -24, ratio: 3 }, high: { threshold: -24, ratio: 3 }, enabled: false },
            gate: { threshold: -40, enabled: true },
            reverb: { wet: 0, enabled: false },
            limiter: { threshold: -1, enabled: true },
            rnnoise: { enabled: true, strength: 90 }
        }
    },
    {
        name: 'Singing',
        icon: 'music',
        settings: {
            gain: 0,
            highpass: { frequency: 60, enabled: true },
            eq: { low: 1, mid: 0, high: 2, enabled: true },
            deesser: { frequency: 5500, reduction: 8, enabled: true },
            compressor: { threshold: -18, ratio: 3, attack: 0.01, release: 0.2, enabled: true },
            multibandCompressor: { low: { threshold: -24, ratio: 2 }, mid: { threshold: -20, ratio: 3 }, high: { threshold: -24, ratio: 2 }, enabled: true },
            gate: { threshold: -55, enabled: false },
            reverb: { wet: 0.25, enabled: true },
            limiter: { threshold: -1, enabled: true },
            rnnoise: { enabled: false, strength: 80 }
        }
    },
    {
        name: 'Clean/Natural',
        icon: 'volume-off',
        settings: {
            gain: 0,
            highpass: { frequency: 80, enabled: false },
            eq: { low: 0, mid: 0, high: 0, enabled: true },
            deesser: { frequency: 6000, reduction: 6, enabled: false },
            compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, enabled: false },
            multibandCompressor: { low: { threshold: -24, ratio: 3 }, mid: { threshold: -24, ratio: 3 }, high: { threshold: -24, ratio: 3 }, enabled: false },
            gate: { threshold: -50, enabled: false },
            reverb: { wet: 0.3, enabled: false },
            limiter: { threshold: -1, enabled: false },
            rnnoise: { enabled: false, strength: 80 }
        }
    }
];

const getPresetIcon = (icon) => {
    switch (icon) {
        case 'mic': return <Mic size={14} />;
        case 'headphones': return <Headphones size={14} />;
        case 'gamepad': return <Gamepad2 size={14} />;
        case 'music': return <Music size={14} />;
        case 'volume-off': return <VolumeX size={14} />;
        default: return <Star size={14} />;
    }
};

function PresetsPanel({ settings, onLoadPreset, onSettingChange }) {
    const [presets, setPresets] = useState(defaultPresets);
    const [customPresets, setCustomPresets] = useState([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    // Load custom presets from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('audio-mixer-presets');
        if (saved) {
            try {
                setCustomPresets(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load custom presets');
            }
        }
    }, []);

    // Save custom presets to localStorage
    const saveCustomPresets = (newPresets) => {
        setCustomPresets(newPresets);
        localStorage.setItem('audio-mixer-presets', JSON.stringify(newPresets));
    };

    const handleSavePreset = () => {
        if (!newPresetName.trim()) return;

        const newPreset = {
            name: newPresetName,
            icon: 'star',
            settings: { ...settings },
            custom: true
        };

        saveCustomPresets([...customPresets, newPreset]);
        setNewPresetName('');
        setShowSaveInput(false);
    };

    const handleDeletePreset = (index) => {
        const newPresets = customPresets.filter((_, i) => i !== index);
        saveCustomPresets(newPresets);
    };

    const handleLoadPreset = (preset) => {
        onLoadPreset(preset.settings);
    };

    return (
        <div className="presets-container">
            <h3 className="presets-title"><Save size={14} /> PRESETS</h3>

            {/* Save Current Settings */}
            <div className="preset-save-section">
                {!showSaveInput ? (
                    <button
                        className="save-preset-btn"
                        onClick={() => setShowSaveInput(true)}
                    >
                        <Plus size={14} /> Save Current Settings
                    </button>
                ) : (
                    <div className="save-preset-form">
                        <input
                            type="text"
                            placeholder="Preset name..."
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
                        />
                        <button onClick={handleSavePreset}><Save size={14} /></button>
                        <button onClick={() => setShowSaveInput(false)}>×</button>
                    </div>
                )}
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
                <div className="preset-group">
                    <h4><Star size={12} /> Your Presets</h4>
                    <div className="preset-list">
                        {customPresets.map((preset, index) => (
                            <div key={`custom-${index}`} className="preset-item custom">
                                <button
                                    className="preset-btn"
                                    onClick={() => handleLoadPreset(preset)}
                                >
                                    <Star size={14} /> {preset.name}
                                </button>
                                <button
                                    className="delete-preset-btn"
                                    onClick={() => handleDeletePreset(index)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Default Presets */}
            <div className="preset-group">
                <h4><Folder size={12} /> Built-in Presets</h4>
                <div className="preset-list">
                    {presets.map((preset, index) => (
                        <div key={`default-${index}`} className="preset-item">
                            <button
                                className="preset-btn"
                                onClick={() => handleLoadPreset(preset)}
                            >
                                {getPresetIcon(preset.icon)} {preset.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="preset-info">
                <p><Info size={12} /> Presets save all your effect settings. Click to load instantly!</p>
            </div>
        </div>
    );
}

export default PresetsPanel;
