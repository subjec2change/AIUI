// Core conversation types
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type Conversation = ConversationMessage[];

export interface ApiHeader {
    text: string;
}

// VAD configuration types
export interface VadConfig {
    preSpeechPadFrames: number;
    positiveSpeechThreshold: number;
    negativeSpeechThreshold: number;
    minSpeechFrames: number;
    startOnLoad: boolean;
}

// VAD state types
export type VadStatus = 'loading' | 'ready' | 'error' | 'inactive';

// Audio processing state types
export type AudioState = 'idle' | 'user-speaking' | 'processing' | 'ai-speaking';

// Settings types
export interface AppSettings {
    apiBasePath: string;
    ttsProvider: string;
    vadPositiveThreshold: number;
    vadNegativeThreshold: number;
}

// Error boundary props
export interface ErrorBoundaryProps {
    children: JSX.Element | JSX.Element[] | null;
}

// Error boundary state
export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// Runtime config exposed via window
export interface RuntimeConfig {
    apiBasePath?: string;
}
