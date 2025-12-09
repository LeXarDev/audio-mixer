import React from 'react';
import { Minus, Square, X, Sliders } from 'lucide-react';

function TitleBar() {
    const handleMinimize = () => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('minimize-window');
        }
    };

    const handleMaximize = () => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('maximize-window');
        }
    };

    const handleClose = () => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('close-window');
        }
    };

    return (
        <div className="title-bar">
            <div className="title-bar-drag">
                <span className="app-icon"><Sliders size={18} /></span>
                <span className="app-title">MIC PROCESSOR PRO</span>
            </div>
            <div className="window-controls">
                <button className="control-btn minimize" onClick={handleMinimize}><Minus size={14} /></button>
                <button className="control-btn maximize" onClick={handleMaximize}><Square size={12} /></button>
                <button className="control-btn close" onClick={handleClose}><X size={14} /></button>
            </div>
        </div>
    );
}

export default TitleBar;
