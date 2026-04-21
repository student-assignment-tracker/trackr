import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { theme } from "../theme";

const DEFAULT_SETTINGS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  cyclesBeforeLong: 4,
};

const MODE_LABELS = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export default function Pomodoro() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(settings.focus);
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);

  const intervalRef = useRef(null);
  // Target end timestamp — makes timer accurate even if the tab is throttled.
  const endAtRef = useRef(null);

  const totalForMode = settings[mode];
  const progress = 1 - secondsLeft / totalForMode;

  // Tick loop — recomputes remaining time from an absolute end timestamp.
  useEffect(() => {
    if (!running) return;
    endAtRef.current = Date.now() + secondsLeft * 1000;
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endAtRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setSecondsLeft(0);
        setRunning(false);
        handleComplete();
      } else {
        setSecondsLeft(remaining);
      }
    }, 250);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // When mode or settings change while stopped, reset the countdown.
  useEffect(() => {
    if (!running) setSecondsLeft(settings[mode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings]);

  function handleComplete() {
    // Gentle beep. Fails silently if the browser blocks audio.
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      /* silent */
    }

    // TODO (when backend ready): log a PomodoroSession via api.createPomodoroSession()
    // if you want study history to persist across devices.

    if (mode === "focus") {
      const next = completedFocus + 1;
      setCompletedFocus(next);
      setMode(next % settings.cyclesBeforeLong === 0 ? "longBreak" : "shortBreak");
    } else {
      setMode("focus");
    }
  }

  function switchMode(newMode) {
    setRunning(false);
    setMode(newMode);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12 }}>
      {/* Mode selector */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 999,
          marginBottom: 36,
        }}
      >
        {["focus", "shortBreak", "longBreak"].map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              background: mode === m ? theme.accent : "transparent",
              color: mode === m ? "white" : theme.inkSoft,
              transition: "background 0.2s",
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Progress ring */}
      <ProgressRing progress={progress} size={260} stroke={6}>
        <div style={{ textAlign: "center" }}>
          <div
            className="display"
            style={{
              fontSize: 56,
              fontWeight: 500,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {formatClock(secondsLeft)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: theme.inkSoft,
              marginTop: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {MODE_LABELS[mode]}
          </div>
        </div>
      </ProgressRing>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginTop: 36, alignItems: "center" }}>
        <button
          onClick={() => {
            setRunning(false);
            setSecondsLeft(settings[mode]);
          }}
          aria-label="Reset"
          style={controlBtnSecondary}
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Pause" : "Start"}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: theme.accent,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(74, 107, 92, 0.35)",
          }}
        >
          {running ? <Pause size={26} /> : <Play size={26} style={{ marginLeft: 3 }} />}
        </button>
        <button
          onClick={() => setShowSettings((s) => !s)}
          aria-label="Settings"
          style={{
            ...controlBtnSecondary,
            background: showSettings ? theme.accentSoft : theme.surface,
            color: showSettings ? theme.accent : theme.inkSoft,
          }}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Session counter */}
      <div style={{ marginTop: 28, display: "flex", gap: 8, alignItems: "center" }}>
        {Array.from({ length: settings.cyclesBeforeLong }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: i < completedFocus % settings.cyclesBeforeLong ? theme.accent : theme.border,
            }}
          />
        ))}
        <span style={{ fontSize: 12, color: theme.inkSoft, marginLeft: 6 }}>
          {completedFocus} completed today
        </span>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={(next) => {
            setSettings(next);
            if (!running) setSecondsLeft(next[mode]);
          }}
        />
      )}
    </div>
  );
}

const controlBtnSecondary = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: `1px solid ${theme.border}`,
  background: theme.surface,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.inkSoft,
};

function ProgressRing({ progress, size, stroke, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.border} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.accent}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onChange }) {
  const rows = [
    { key: "focus", label: "Focus length", min: 1, max: 90 },
    { key: "shortBreak", label: "Short break", min: 1, max: 30 },
    { key: "longBreak", label: "Long break", min: 1, max: 60 },
  ];
  return (
    <div
      style={{
        width: "100%",
        marginTop: 28,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: theme.inkSoft,
          marginBottom: 14,
        }}
      >
        Durations (minutes)
      </div>
      {rows.map(({ key, label, min, max }) => {
        const mins = Math.round(settings[key] / 60);
        return (
          <SettingRow
            key={key}
            label={label}
            value={mins}
            onDec={() => onChange({ ...settings, [key]: Math.max(min, mins - 1) * 60 })}
            onInc={() => onChange({ ...settings, [key]: Math.min(max, mins + 1) * 60 })}
          />
        );
      })}
      <SettingRow
        label="Sessions before long break"
        value={settings.cyclesBeforeLong}
        onDec={() =>
          onChange({ ...settings, cyclesBeforeLong: Math.max(2, settings.cyclesBeforeLong - 1) })
        }
        onInc={() =>
          onChange({ ...settings, cyclesBeforeLong: Math.min(8, settings.cyclesBeforeLong + 1) })
        }
        last
      />
    </div>
  );
}

function SettingRow({ label, value, onDec, onInc, last = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${theme.border}`,
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onDec} style={stepperBtn}>
          −
        </button>
        <span
          style={{
            minWidth: 28,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
          }}
        >
          {value}
        </span>
        <button onClick={onInc} style={stepperBtn}>
          +
        </button>
      </div>
    </div>
  );
}

const stepperBtn = {
  width: 28,
  height: 28,
  borderRadius: theme.radiusSm,
  border: `1px solid ${theme.border}`,
  fontSize: 16,
  background: "transparent",
};

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
