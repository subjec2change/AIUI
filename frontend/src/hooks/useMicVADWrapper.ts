import { useEffect, useRef, useCallback } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { onMisfire, onSpeechEnd, onSpeechStart } from "../speech-manager.ts";
import type { VadConfig, VadStatus } from "../types";

// Default VAD thresholds - can be overridden via localStorage settings
const DEFAULT_VAD_CONFIG: Omit<VadConfig, "startOnLoad"> = {
    preSpeechPadFrames: 5,
    positiveSpeechThreshold: 0.9,
    negativeSpeechThreshold: 0.75,
    minSpeechFrames: 4,
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface UseMicVADWrapperReturn {
    status: VadStatus;
    micActive: boolean;
    error: string | null;
}

export function useMicVADWrapper(
    onLoadingChange: (loading: boolean) => void,
    onStatusChange?: (status: VadStatus) => void,
    vadConfig?: Partial<Omit<VadConfig, "startOnLoad">>
): UseMicVADWrapperReturn {
    const retryCountRef = useRef(0);
    const vadInstanceRef = useRef<ReturnType<typeof useMicVAD> | null>(null);
    const isUnmountedRef = useRef(false);

    // Merge config
    const effectiveConfig: VadConfig = {
        ...DEFAULT_VAD_CONFIG,
        ...vadConfig,
        startOnLoad: true,
    };

    const onSpeechStartRef = useCallback(onSpeechStart, []);
    const onSpeechEndRef = useCallback(
        (audio: Float32Array) => onSpeechEnd(audio),
        []
    );
    const onMisfireRef = useCallback(onMisfire, []);

    const micVAD = useMicVAD({
        preSpeechPadFrames: effectiveConfig.preSpeechPadFrames,
        positiveSpeechThreshold: effectiveConfig.positiveSpeechThreshold,
        negativeSpeechThreshold: effectiveConfig.negativeSpeechThreshold,
        minSpeechFrames: effectiveConfig.minSpeechFrames,
        startOnLoad: effectiveConfig.startOnLoad,
        onSpeechStart: onSpeechStartRef,
        onSpeechEnd: onSpeechEndRef,
        onVADMisfire: onMisfireRef,
    });

    // Track unmount
    useEffect(() => {
        isUnmountedRef.current = false;
        return () => {
            isUnmountedRef.current = true;
            vadInstanceRef.current = null;
        };
    }, []);

    // Track loading state
    const loadingRef = useRef(micVAD.loading);
    useEffect(() => {
        if (loadingRef.current !== micVAD.loading) {
            onLoadingChange(micVAD.loading);
            loadingRef.current = micVAD.loading;

            // Determine status from loading state
            if (isUnmountedRef.current) return;

            if (micVAD.loading) {
                onStatusChange?.("loading");
            } else if (micVAD.errored) {
                onStatusChange?.("error");
            } else {
                onStatusChange?.("ready");
            }
        }
    }, [micVAD.loading, micVAD.errored, onLoadingChange, onStatusChange]);

    // Retry logic: if mic fails initially, retry a few times
    useEffect(() => {
        if (micVAD.errored && micVAD.loading === false) {
            // Only retry if we haven't exceeded max retries
            if (retryCountRef.current < MAX_RETRIES) {
                retryCountRef.current++;
                const timeout = setTimeout(() => {
                    if (isUnmountedRef.current) return;
                    // Force reload to re-initialize mic
                    window.location.reload();
                }, RETRY_DELAY_MS * retryCountRef.current);

                return () => clearTimeout(timeout);
            }
        }
    }, [micVAD.errored, micVAD.loading]);

    vadInstanceRef.current = micVAD;

    return {
        status: micVAD.loading ? "loading" : micVAD.errored ? "error" : "ready",
        micActive: micVAD.listening,
        error: micVAD.errored === false ? null : micVAD.errored.message,
    };
}
