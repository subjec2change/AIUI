import { utils } from "@ricky0123/vad-react";
import type { Conversation } from "./types";
import { particleActions } from "./particle-manager.ts";

let source: AudioBufferSourceNode | null = null;
let sourceIsStarted = false;

const conversation: Conversation = [];

// Get API base path: prefer runtime override (from SettingsPanel), then window config, then default
function getApiBaseUrl(): string {
    if (window.__AIUI__?.apiBasePath) {
        return window.__AIUI__.apiBasePath;
    }
    return window.API_BASE || "/inference";
}

export const onSpeechStart = () => {
    console.log("speech started");
    particleActions.onUserSpeaking();
    stopSourceIfNeeded();
};

export const onSpeechEnd = async (audio: Float32Array) => {
    console.log("speech ended");
    await processAudio(audio);
};

export const onMisfire = () => {
    console.log("vad misfire");
    particleActions.reset();
};

const stopSourceIfNeeded = () => {
    if (source && sourceIsStarted) {
        try {
            source.stop();
        } catch {
            // already stopped
        }
        source = null;
        sourceIsStarted = false;
    }
};

const processAudio = async (audio: Float32Array) => {
    particleActions.onProcessing();
    const blob = createAudioBlob(audio);
    await validate(blob);
    sendData(blob);
};

const createAudioBlob = (audio: Float32Array): Blob => {
    const wavBuffer = utils.encodeWAV(audio);
    return new Blob([wavBuffer], { type: "audio/wav" });
};

const sendData = (blob: Blob) => {
    console.log("sending data");
    const baseUrl = getApiBaseUrl();
    fetch(baseUrl, {
        method: "POST",
        body: createBody(blob),
        headers: {
            conversation: base64Encode(JSON.stringify(conversation)),
        },
    })
        .then(handleResponse)
        .then(handleSuccess)
        .catch(handleError);
};

function base64Encode(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return window.btoa(String.fromCharCode(...new Uint8Array(data)));
}

function base64Decode(base64: string): string {
    const binaryStr = window.atob(base64);
    const bytes = new Uint8Array([...binaryStr].map((char) => char.charCodeAt(0)));
    return new TextDecoder().decode(bytes);
}

const handleResponse = async (res: Response): Promise<Blob> => {
    if (!res.ok) {
        return res.text().then((error) => {
            throw new Error(error);
        });
    }

    const textHeader = res.headers.get("conversation");
    if (textHeader) {
        const newMessages: Conversation = JSON.parse(base64Decode(textHeader));
        conversation.push(...newMessages);
    }
    return res.blob();
};

const createBody = (data: Blob): FormData => {
    const formData = new FormData();
    formData.append("audio", data, "audio.wav");
    return formData;
};

const handleSuccess = async (blob: Blob) => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    stopSourceIfNeeded();

    source = audioContext.createBufferSource();
    source.buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    source.connect(audioContext.destination);
    source.start(0);
    sourceIsStarted = true;
    source.onended = particleActions.reset;

    particleActions.onAiSpeaking();
};

const handleError = (error: Error) => {
    console.log(`error encountered: ${error.message}`);
    particleActions.reset();
};

const validate = async (data: Blob) => {
    const audioContext = new AudioContext();
    const decodedData = await audioContext.decodeAudioData(await data.arrayBuffer());
    const duration = decodedData.duration;
    const minDuration = 0.4;

    if (duration < minDuration) throw new Error(`Duration is ${duration}s, which is less than minimum of ${minDuration}s`);
};
