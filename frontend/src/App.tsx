import { useState, useCallback, useEffect } from "react";
import { useMicVADWrapper } from "./hooks/useMicVADWrapper";
import RotateLoader from "react-spinners/RotateLoader";
import { particleActions } from "./particle-manager.ts";
import Canvas from "./Canvas.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import type { VadStatus, AppSettings } from "./types.ts";

// Load initial settings from localStorage
function loadInitialSettings(): AppSettings {
    try {
        const raw = localStorage.getItem("aiui-settings");
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                apiBasePath: parsed.apiBasePath || "/inference",
                ttsProvider: parsed.ttsProvider || "piper",
                vadPositiveThreshold: parsed.vadPositiveThreshold ?? 0.9,
                vadNegativeThreshold: parsed.vadNegativeThreshold ?? 0.75,
            };
        }
    } catch {
        // ignore corrupt data
    }
    return {
        apiBasePath: "/inference",
        ttsProvider: "piper",
        vadPositiveThreshold: 0.9,
        vadNegativeThreshold: 0.75,
    };
}

const AppContent = () => {
    const [loading, setLoading] = useState(true);
    const [vadStatus, setVadStatus] = useState<VadStatus>("loading");
    const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);

    const handleSettingsChange = useCallback((newSettings: AppSettings) => {
        setSettings(newSettings);
    }, []);

    // Apply apiBasePath to window config
    useEffect(() => {
        window.__AIUI__ = { apiBasePath: settings.apiBasePath };
    }, [settings.apiBasePath]);

    const vadResult = useMicVADWrapper(
        setLoading,
        setVadStatus,
        {
            positiveSpeechThreshold: settings.vadPositiveThreshold,
            negativeSpeechThreshold: settings.vadNegativeThreshold,
        }
    );

    const isLoading = loading || vadStatus === "loading";
    const isError = vadStatus === "error";

    if (isLoading) {
        const statusMessage = vadStatus === "loading"
            ? "Initializing voice recognition..."
            : "Loading...";

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    width: "100vw",
                    backgroundColor: "#000",
                }}
            >
                <RotateLoader
                    loading={loading}
                    color={"#27eab6"}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
                <div
                    style={{
                        marginTop: "1rem",
                        color: "#aaa",
                        fontSize: "0.875rem",
                        textAlign: "center",
                    }}
                >
                    {statusMessage}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    width: "100vw",
                    backgroundColor: "#000",
                    color: "#ff6b6b",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                    Microphone Error
                </div>
                <div
                    style={{
                        fontSize: "0.875rem",
                        color: "#aaa",
                        textAlign: "center",
                        maxWidth: "400px",
                        marginBottom: "1rem",
                    }}
                >
                    {vadResult.error || "Could not access microphone. Please check permissions and reload."}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#27eab6",
                        color: "#000",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "bold",
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <Canvas draw={particleActions.draw} />
            <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
        </>
    );
};

const App = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;
