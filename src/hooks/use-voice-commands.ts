// Simple Web Speech API wrapper. Returns a toggle fn and isListening state.
// Not available in all browsers — gracefully no-op if not.

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

export function useVoiceCommands(onCommand: (cmd: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onCmdRef = useRef(onCommand);
  onCmdRef.current = onCommand;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: unknown) => {
      const ev = e as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      const last = ev.results[ev.results.length - 1];
      const text = last[0].transcript.trim().toLowerCase();
      onCmdRef.current(text);
    };
    rec.onerror = () => {
      /* ignore */
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setSupported(true);
  }, []);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        /* already started */
      }
    }
  }, [listening]);

  return { supported, listening, toggle };
}
