import { useState, useRef, useCallback } from "react";

interface VADOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onVolumeChange?: (volume: number) => void;
  minVolume?: number;      
  silenceDuration?: number; 
}

export function useVAD({
  onSpeechStart,
  onSpeechEnd,
  onVolumeChange,
  minVolume = 0.05,
  silenceDuration = 1500,
}: VADOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
       return; 
    }

    try {
      let options: MediaRecorderOptions = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
             options = { mimeType: 'audio/mp4' };
          } else {
             options = {}; 
          }
      }

      const recorder = new MediaRecorder(streamRef.current, options);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: options.mimeType || 'audio/webm' });
        if (onSpeechEnd) {
            onSpeechEnd(blob);
        }
        audioChunksRef.current = [];
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("Recorder start error:", e);
    }
  }, [onSpeechEnd]); 

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsListening(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const analyze = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const volume = sum / dataArray.length / 255;

        if (onVolumeChange) onVolumeChange(volume);

        if (volume > minVolume) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            if (onSpeechStart) onSpeechStart();
            
            startRecording();
          }
        } 
        else if (isSpeakingRef.current) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              isSpeakingRef.current = false;
              setIsSpeaking(false);
              stopRecording();
              silenceTimerRef.current = null;
            }, silenceDuration);
          }
        }

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();

    } catch (error) {
      console.error("VAD Start Error:", error);
    }
  }, [minVolume, silenceDuration, onVolumeChange, onSpeechStart, startRecording, stopRecording]); 

  const stop = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    stopRecording();

    setIsListening(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, [stopRecording]);

  return { isListening, isSpeaking, start, stop };
}