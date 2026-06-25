declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    API_BASE?: string;
    __AIUI__?: {
      apiBasePath?: string;
    };
  }
}

export {};
