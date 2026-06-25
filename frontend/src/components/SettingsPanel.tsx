import { useState } from 'react';
import type { AppSettings } from '../types';

const SETTINGS_KEY = 'aiui-settings';

const DEFAULT_SETTINGS: AppSettings = {
    apiBasePath: '/inference',
    ttsProvider: 'piper',
    vadPositiveThreshold: 0.9,
    vadNegativeThreshold: 0.75,
};

function saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface SettingsPanelProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleApiBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newSettings: AppSettings = { ...settings, apiBasePath: val };
        saveSettings(newSettings);
        onSettingsChange(newSettings);
        // Update window-level config so speech-manager picks it up
        window.__AIUI__ = { ...window.__AIUI__, apiBasePath: val };
    };

    const handleTtsProviderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newSettings: AppSettings = { ...settings, ttsProvider: val };
        saveSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const handleThresholdChange = (field: 'vadPositiveThreshold' | 'vadNegativeThreshold') => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        const newSettings: AppSettings = { ...settings, [field]: val };
        saveSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const handleReset = () => {
        saveSettings(DEFAULT_SETTINGS);
        window.__AIUI__ = { ...window.__AIUI__, apiBasePath: DEFAULT_SETTINGS.apiBasePath };
        onSettingsChange(DEFAULT_SETTINGS);
    };

    const PanelContent = (
        <div
            style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 100,
                backgroundColor: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '16px',
                minWidth: '260px',
                color: '#ccc',
                fontSize: '0.85rem',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, color: '#27eab6', fontSize: '0.95rem' }}>Settings</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'none', border: 'none', color: '#888',
                        cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
                    }}
                >
                    ×
                </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>API Base Path</label>
                <input
                    type="text"
                    value={settings.apiBasePath}
                    onChange={handleApiBaseChange}
                    style={{
                        width: '100%', padding: '6px 8px',
                        backgroundColor: '#1a1a1a', color: '#fff',
                        border: '1px solid #333', borderRadius: '4px',
                        fontSize: '0.85rem', boxSizing: 'border-box',
                    }}
                />
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                    e.g. /inference or http://localhost:8080/inference
                </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>TTS Provider</label>
                <input
                    type="text"
                    value={settings.ttsProvider}
                    onChange={handleTtsProviderChange}
                    style={{
                        width: '100%', padding: '6px 8px',
                        backgroundColor: '#1a1a1a', color: '#fff',
                        border: '1px solid #333', borderRadius: '4px',
                        fontSize: '0.85rem', boxSizing: 'border-box',
                    }}
                />
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>
                    VAD Positive Threshold: {settings.vadPositiveThreshold.toFixed(2)}
                </label>
                <input
                    type="range" min="0.01" max="1" step="0.01"
                    value={settings.vadPositiveThreshold}
                    onChange={handleThresholdChange('vadPositiveThreshold')}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>
                    VAD Negative Threshold: {settings.vadNegativeThreshold.toFixed(2)}
                </label>
                <input
                    type="range" min="0.01" max="1" step="0.01"
                    value={settings.vadNegativeThreshold}
                    onChange={handleThresholdChange('vadNegativeThreshold')}
                    style={{ width: '100%' }}
                />
            </div>

            <button
                onClick={handleReset}
                style={{
                    width: '100%', padding: '6px',
                    backgroundColor: 'transparent', color: '#ff9800',
                    border: '1px solid #ff9800', borderRadius: '4px',
                    cursor: 'pointer', fontSize: '0.8rem',
                }}
            >
                Reset to Defaults
            </button>
        </div>
    );

    if (isOpen) return PanelContent;

    return (
        <button
            onClick={() => setIsOpen(true)}
            style={{
                position: 'absolute', top: '12px', right: '12px', zIndex: 100,
                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#888', borderRadius: '6px', padding: '6px 10px',
                cursor: 'pointer', fontSize: '0.8rem',
            }}
            title="Settings"
        >
            ⚙
        </button>
    );
}
