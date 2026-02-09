"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Mic, Square, StopCircle, Volume2, Briefcase, Building2 } from "lucide-react";

import MessageBubble from "@/components/chat/MessageBubble";
import FeedbackCard from "@/components/chat/FeedbackCard";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages, isProcessing]);

  useEffect(() => {
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
                interview_step: 0
            });
            setMessages([{ role: "ai", content: res.data.response_text }]);
            setStep(res.data.interview_step);
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
      alert("Please allow microphone access to use this feature.");
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

      if (data.is_finished && data.feedback) {
        setFeedback(data.feedback);
      }

      if (data.response_audio) {
        playAudio(data.response_audio);
      }

    } catch (error) {
      console.error("Audio Upload Error:", error);
      alert("Failed to process audio. Ensure backend is running.");
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
      
      audio.onended = () => {
        setIsPlaying(false);
      };
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
           <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
              
              <div className="text-sm font-medium text-gray-500 h-6">
                 {isRecording ? (
                    <span className="text-red-500 animate-pulse flex items-center gap-2">
                       <span className="h-2 w-2 bg-red-500 rounded-full" /> Recording...
                    </span>
                 ) : isProcessing ? (
                    <span className="text-blue-500">Processing...</span>
                 ) : isPlaying ? (
                    <span className="text-green-500 flex items-center gap-2">
                       <Volume2 className="h-4 w-4" /> AI Speaking...
                    </span>
                 ) : (
                    "Ready to speak"
                 )}
              </div>

              <button
                 onClick={isRecording ? stopRecording : startRecording}
                 disabled={isProcessing || isPlaying}
                 className={`
                    h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                    ${isRecording 
                       ? "bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-200" 
                       : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300
                 `}
              >
                 {isRecording ? (
                    <Square className="h-8 w-8 text-white fill-current" />
                 ) : (
                    <Mic className="h-8 w-8 text-white" />
                 )}
              </button>
              
              <p className="text-xs text-gray-400">
                 {isRecording ? "Tap to send answer" : "Tap microphone to start speaking"}
              </p>

           </div>
        </div>
      )}
    </div>
  );
}