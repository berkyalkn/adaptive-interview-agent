"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Mic, Building2 } from "lucide-react"; 

import MessageBubble from "@/components/chat/MessageBubble";
import FeedbackCard from "@/components/chat/FeedbackCard";
import VoiceControls from "@/components/chat/VoiceControls"; 

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function VoiceInterviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const jobRole = searchParams.get("role") || "";
  const companyContext = searchParams.get("context") || "General Tech";

  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(false);       
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages, isProcessing]);

  useEffect(() => {

    if (hasInitialized.current) return;
    
    hasInitialized.current = true;
    
    if (!jobRole) {
      router.push("/");
      return;
    }
    
    const initInterview = async () => {
        try {
            const res = await axios.post("http://localhost:8000/chat", {
                job_role: jobRole,
                company_context: companyContext,
                messages: [],
                interview_step: 0,
                generate_audio: true
            });
            setMessages([{ role: "ai", content: res.data.response_text }]);
            setStep(res.data.interview_step);

            if (res.data.response_audio) {
              playAudio(res.data.response_audio);
          }
        } catch (error) {
            console.error("Init Error", error);
        }
    };
    
    initInterview();
  }, []);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleAudioStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioStop = async () => {
    setIsProcessing(true);
    
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("job_role", jobRole);
    formData.append("company_context", companyContext);
    formData.append("interview_step", step.toString());
    formData.append("messages", JSON.stringify(messages));

    try {
      const res = await axios.post("http://localhost:8000/chat/audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      const userMsg: Message = { role: "user", content: data.user_input };
      const aiMsg: Message = { role: "ai", content: data.response_text };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setStep(data.interview_step);

      if (data.is_finished && data.feedback) setFeedback(data.feedback);
      if (data.response_audio) playAudio(data.response_audio);

    } catch (error) {
      console.error("Audio Upload Error:", error);
      alert("Backend connection failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    try {
      const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioSrc);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    } catch (e) {
      console.error("Audio Playback Error:", e);
      setIsPlaying(false);
    }
  };


  return (
    <div className="flex h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                   <Mic className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                   <h1 className="text-sm font-bold text-gray-900 leading-tight">{jobRole}</h1>
                   <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="h-3 w-3" />
                      <span>{companyContext}</span>
                   </div>
                </div>
             </div>
          </div>
          <div className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
            Voice Mode • Step {step}/4
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
        <div className="mx-auto max-w-3xl space-y-6 pb-32">
          
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} role={msg.role} content={msg.content} />
          ))}

          {isProcessing && (
             <div className="flex items-center gap-3 text-gray-500 text-sm animate-pulse ml-4">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                <span>AI is listening & thinking...</span>
             </div>
          )}

          {feedback && (
            <FeedbackCard feedback={feedback} onRestart={() => router.push("/")} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {!feedback && (
        <VoiceControls 
            isRecording={isRecording}
            isProcessing={isProcessing}
            isPlaying={isPlaying}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
        />
      )}
    </div>
  );
}