import React from 'react';
import {
    Filter, Sliders, Volume2, Zap, Layers, Ban,
    Waves, Shield
} from 'lucide-react';

function EffectsPanel({ settings, onSettingChange }) {
    const updateEffect = (effect, key, value) => {
        onSettingChange(effect, { ...settings[effect], [key]: value });
    };

    const updateMultibandBand = (band, key, value) => {
        const newMB = { ...settings.multibandCompressor };
        newMB[band] = { ...newMB[band], [key]: value };
        onSettingChange('multibandCompressor', newMB);
    };

    return (
        <div className="effects-container">
            <h3 className="effects-title"><Zap size={14} /> EFFECTS</h3>

            {/* High-Pass Filter */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Filter size={14} /> High-Pass Filter</span>
                    <button
                        className={`toggle-btn ${settings.highpass?.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('highpass', 'enabled', !settings.highpass?.enabled)}
                    >
                        {settings.highpass?.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="effect-controls">
                    <div className="control-row">
                        <label>Frequency</label>
                        <input
                            type="range"
                            min="20" max="500" step="10"
                            value={settings.highpass?.frequency || 80}
                            onChange={(e) => updateEffect('highpass', 'frequency', parseInt(e.target.value))}
                            className="slider"
                        />
                        <span className="value">{settings.highpass?.frequency || 80}Hz</span>
                    </div>
                </div>
            </div>

            {/* Equalizer */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Sliders size={14} /> Equalizer</span>
                </div>
                <div className="eq-controls">
                    <div className="eq-band">
                        <span className="band-label">LOW</span>
                        <input
                            type="range"
                            min="-12" max="12" step="1"
                            value={settings.eq.low}
                            onChange={(e) => updateEffect('eq', 'low', parseInt(e.target.value))}
                            className="slider vertical"
                            orient="vertical"
                        />
                        <span className="band-value">{settings.eq.low > 0 ? '+' : ''}{settings.eq.low}</span>
                    </div>
                    <div className="eq-band">
                        <span className="band-label">MID</span>
                        <input
                            type="range"
                            min="-12" max="12" step="1"
                            value={settings.eq.mid}
                            onChange={(e) => updateEffect('eq', 'mid', parseInt(e.target.value))}
                            className="slider vertical"
                            orient="vertical"
                        />
                        <span className="band-value">{settings.eq.mid > 0 ? '+' : ''}{settings.eq.mid}</span>
                    </div>
                    <div className="eq-band">
                        <span className="band-label">HIGH</span>
                        <input
                            type="range"
                            min="-12" max="12" step="1"
                            value={settings.eq.high}
                            onChange={(e) => updateEffect('eq', 'high', parseInt(e.target.value))}
                            className="slider vertical"
                            orient="vertical"
                        />
                        <span className="band-value">{settings.eq.high > 0 ? '+' : ''}{settings.eq.high}</span>
                    </div>
                </div>
            </div>

            {/* De-Esser */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Volume2 size={14} /> De-Esser</span>
                    <button
                        className={`toggle-btn ${settings.deesser?.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('deesser', 'enabled', !settings.deesser?.enabled)}
                    >
                        {settings.deesser?.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="effect-controls">
                    <div className="control-row">
                        <label>Frequency</label>
                        <input
                            type="range"
                            min="4000" max="10000" step="100"
                            value={settings.deesser?.frequency || 6000}
                            onChange={(e) => updateEffect('deesser', 'frequency', parseInt(e.target.value))}
                            className="slider"
                        />
                        <span className="value">{(settings.deesser?.frequency || 6000) / 1000}kHz</span>
                    </div>
                    <div className="control-row">
                        <label>Reduction</label>
                        <input
                            type="range"
                            min="0" max="18" step="1"
                            value={settings.deesser?.reduction || 6}
                            onChange={(e) => updateEffect('deesser', 'reduction', parseInt(e.target.value))}
                            className="slider"
                        />
                        <span className="value">-{settings.deesser?.reduction || 6}dB</span>
                    </div>
                </div>
            </div>

            {/* Compressor */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Zap size={14} /> Compressor</span>
                    <button
                        className={`toggle-btn ${settings.compressor.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('compressor', 'enabled', !settings.compressor.enabled)}
                    >
                        {settings.compressor.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="effect-controls">
                    <div className="control-row">
                        <label>Threshold</label>
                        <input
                            type="range"
                            min="-60" max="0" step="1"
                            value={settings.compressor.threshold}
                            onChange={(e) => updateEffect('compressor', 'threshold', parseInt(e.target.value))}
                            className="slider"
                        />
                        <span className="value">{settings.compressor.threshold}dB</span>
                    </div>
                    <div className="control-row">
                        <label>Ratio</label>
                        <input
                            type="range"
                            min="1" max="20" step="1"
                            value={settings.compressor.ratio}
                            onChange={(e) => updateEffect('compressor', 'ratio', parseInt(e.target.value))}
                            className="slider"
                        />
                        <span className="value">{settings.compressor.ratio}:1</span>
                    </div>
                </div>
            </div>

            {/* Multi-band Compressor */}
            <div className="effect-card multiband">
                <div className="effect-header">
                    <span><Layers size={14} /> Multi-band Compressor</span>
                    <button
                        className={`toggle-btn ${settings.multibandCompressor?.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('multibandCompressor', 'enabled', !settings.multibandCompressor?.enabled)}
                    >
                        {settings.multibandCompressor?.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="multiband-controls">
                    {/* Low Band */}
                    <div className="mb-band">
                        <span className="mb-label">LOW</span>
                        <div className="mb-control">
                            <label>Thresh</label>
                            <input
                                type="range" min="-60" max="0" step="1"
                                value={settings.multibandCompressor?.low?.threshold || -24}
                                onChange={(e) => updateMultibandBand('low', 'threshold', parseInt(e.target.value))}
                                className="slider mini"
                            />
                            <span className="value-mini">{settings.multibandCompressor?.low?.threshold || -24}</span>
                        </div>
                        <div className="mb-control">
                            <label>Ratio</label>
                            <input
                                type="range" min="1" max="10" step="0.5"
                                value={settings.multibandCompressor?.low?.ratio || 3}
                                onChange={(e) => updateMultibandBand('low', 'ratio', parseFloat(e.target.value))}
                                className="slider mini"
                            />
                            <span className="value-mini">{settings.multibandCompressor?.low?.ratio || 3}:1</span>
                        </div>
                    </div>
                    {/* Mid Band */}
                    <div className="mb-band">
                        <span className="mb-label">MID</span>
                        <div className="mb-control">
                            <label>Thresh</label>
                            <input
                                type="range" min="-60" max="0" step="1"
                                value={settings.multibandCompressor?.mid?.threshold || -24}
                                onChange={(e) => updateMultibandBand('mid', 'threshold', parseInt(e.target.value))}
                                className="slider mini"
                            />
                            <span className="value-mini">{settings.multibandCompressor?.mid?.threshold || -24}</span>
                        </div>
                        <div className="mb-control">
                            <label>Ratio</label>
                            <input
                                type="range" min="1" max="10" step="0.5"
                                value={settings.multibandCompressor?.mid?.ratio || 3}
                                onChange={(e) => updateMultibandBand('mid', 'ratio', parseFloat(e.target.value))}
                                className="slider mini"
                            />
                            <span className="value-mini">{settings.multibandCompressor?.mid?.ratio || 3}:1</span>
                        </div>
                    </div>
                    {/* High Band */}
                    <div className="mb-band">
                        <span className="mb-label">HIGH</span>
                        <div className="mb-control">
                            <label>Thresh</label>
                            <input
                                type="range" min="-60" max="0" step="1"
                                value={settings.multibandCompressor?.high?.threshold || -24}
                                onChange={(e) => updateMultibandBand('high', 'threshold', parseInt(e.target.value))}
                                className="slider mini"
                            />
                            <span className="value-mini">{settings.multibandCompressor?.high?.threshold || -24}</span>
                        </div>
                        <div className="mb-control">
                            <label>Ratio</label>
                            <input
                                type="range" min="1" max="10" step="0.5"
                                value={settings.multibandCompressor?.high?.ratio || 3}
                                onChange={(e) => updateMultibandBand('high', 'ratio', parseFloat(e.target.value))}
                                className="slider mini"
                            />
                            <span className="value-mini">{settings.multibandCompressor?.high?.ratio || 3}:1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Noise Gate */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Ban size={14} /> Noise Gate</span>
                    <button
                        className={`toggle-btn ${settings.gate.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('gate', 'enabled', !settings.gate.enabled)}
                    >
                        {settings.gate.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="effect-controls">
                    <div className="control-row">
                        <label>Threshold</label>
                        <input
                            type="range"
                            min="-80" max="-20" step="1"
                            value={settings.gate.threshold}
                            onChange={(e) => updateEffect('gate', 'threshold', parseInt(e.target.value))}
                            className="slider"
                        />
                        <span className="value">{settings.gate.threshold}dB</span>
                    </div>
                </div>
            </div>

            {/* Reverb */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Waves size={14} /> Reverb</span>
                    <button
                        className={`toggle-btn ${settings.reverb.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('reverb', 'enabled', !settings.reverb.enabled)}
                    >
                        {settings.reverb.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="effect-controls">
                    <div className="control-row">
                        <label>Mix</label>
                        <input
                            type="range"
                            min="0" max="100" step="1"
                            value={settings.reverb.wet * 100}
                            onChange={(e) => updateEffect('reverb', 'wet', parseInt(e.target.value) / 100)}
                            className="slider"
                        />
                        <span className="value">{Math.round(settings.reverb.wet * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Limiter */}
            <div className="effect-card">
                <div className="effect-header">
                    <span><Shield size={14} /> Limiter</span>
                    <button
                        className={`toggle-btn ${settings.limiter.enabled ? 'active' : ''}`}
                        onClick={() => updateEffect('limiter', 'enabled', !settings.limiter.enabled)}
                    >
                        {settings.limiter.enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
                <div className="effect-controls">
                    <div className="control-row">
                        <label>Ceiling</label>
                        <input
                            type="range"
                            min="-12" max="0" step="0.1"
                            value={settings.limiter.threshold}
                            onChange={(e) => updateEffect('limiter', 'threshold', parseFloat(e.target.value))}
                            className="slider"
                        />
                        <span className="value">{settings.limiter.threshold}dB</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EffectsPanel;
