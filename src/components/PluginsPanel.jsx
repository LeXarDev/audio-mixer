import React, { useState } from 'react';
import { Plug, Bot, Sliders, FolderOpen, AlertTriangle, Info, Target } from 'lucide-react';

function PluginsPanel({ settings, onSettingChange }) {
    const [vstFolder, setVstFolder] = useState('');
    const [vstPlugins, setVstPlugins] = useState([]);

    const updatePlugin = (plugin, key, value) => {
        onSettingChange(plugin, { ...settings[plugin], [key]: value });
    };

    const handleSelectVstFolder = async () => {
        // In Electron, use dialog to select folder
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                const result = await ipcRenderer.invoke('select-vst-folder');
                if (result) {
                    setVstFolder(result.folder);
                    setVstPlugins(result.plugins || []);
                }
            } catch (e) {
                console.log('VST folder selection not available');
            }
        } else {
            alert('VST selection only works in Electron app');
        }
    };

    return (
        <div className="plugins-container">
            <h3 className="plugins-title"><Plug size={14} /> PLUGINS</h3>

            {/* RNNoise */}
            <div className="plugin-card rnnoise">
                <div className="plugin-header">
                    <div className="plugin-info">
                        <span className="plugin-icon"><Bot size={18} /></span>
                        <div>
                            <span className="plugin-name">RNNoise</span>
                            <span className="plugin-desc">AI Noise Reduction</span>
                        </div>
                    </div>
                    <button
                        className={`toggle-btn large ${settings.rnnoise?.enabled ? 'active' : ''}`}
                        onClick={() => updatePlugin('rnnoise', 'enabled', !settings.rnnoise?.enabled)}
                    >
                        {settings.rnnoise?.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="plugin-controls">
                    <div className="control-row">
                        <label>Strength</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={settings.rnnoise?.strength || 80}
                            onChange={(e) => updatePlugin('rnnoise', 'strength', parseInt(e.target.value))}
                            className="slider"
                            disabled={!settings.rnnoise?.enabled}
                        />
                        <span className="value">{settings.rnnoise?.strength || 80}%</span>
                    </div>
                    <p className="plugin-note">
                        <Target size={12} /> Automatically removes background noise using AI
                    </p>
                </div>
            </div>

            {/* VST Plugins */}
            <div className="plugin-card vst">
                <div className="plugin-header">
                    <div className="plugin-info">
                        <span className="plugin-icon"><Sliders size={18} /></span>
                        <div>
                            <span className="plugin-name">VST Plugins</span>
                            <span className="plugin-desc">External Audio Plugins</span>
                        </div>
                    </div>
                </div>

                <div className="plugin-controls">
                    <div className="vst-folder-selector">
                        <label>VST Folder</label>
                        <div className="folder-input">
                            <input
                                type="text"
                                value={vstFolder}
                                placeholder="C:\Program Files\VSTPlugins"
                                readOnly
                            />
                            <button onClick={handleSelectVstFolder} className="browse-btn">
                                <FolderOpen size={12} /> Browse
                            </button>
                        </div>
                    </div>

                    {vstPlugins.length > 0 && (
                        <div className="vst-list">
                            <label>Available Plugins</label>
                            {vstPlugins.map((plugin, index) => (
                                <div key={index} className="vst-item">
                                    <span className="vst-name">{plugin}</span>
                                    <button className="vst-load-btn">Load</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {vstPlugins.length === 0 && (
                        <p className="plugin-note">
                            <AlertTriangle size={12} /> VST plugins require native support.<br />
                            Select a VST folder to scan for plugins.
                        </p>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="plugin-info-box">
                <h4><Info size={12} /> Info</h4>
                <ul>
                    <li><strong>RNNoise:</strong> AI filter for noise reduction</li>
                    <li><strong>VST:</strong> Requires plugins installed on system</li>
                </ul>
            </div>
        </div>
    );
}

export default PluginsPanel;
