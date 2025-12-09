import React from 'react';
import { Mic } from 'lucide-react';

function MicrophonePanel({ devices, selected, onSelect, gain, onGainChange, isRunning }) {
    return (
        <div className="panel mic-panel">
            <div className="panel-header">
                <span className="panel-icon"><Mic size={16} /></span>
                <span className="panel-title">INPUT</span>
            </div>

            <div className="panel-content">
                <div className="form-group">
                    <label>Microphone</label>
                    <select
                        value={selected}
                        onChange={(e) => onSelect(e.target.value)}
                    >
                        {devices.length === 0 && (
                            <option value="">No microphone found</option>
                        )}
                        {devices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Gain <span className="value">{gain > 0 ? '+' : ''}{gain}dB</span></label>
                    <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        onChange={(e) => onGainChange(parseInt(e.target.value))}
                        className="slider"
                    />
                    <div className="slider-labels">
                        <span>-12</span>
                        <span>0</span>
                        <span>+12</span>
                    </div>
                </div>

                {isRunning && (
                    <div className="mic-status active">
                        <span className="status-dot"></span>
                        <span>Active</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MicrophonePanel;
