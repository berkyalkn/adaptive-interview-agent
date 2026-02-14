"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVAD } from "@/app/hooks/useVAD";
import { Mic, PhoneOff, Building2, User, Volume2, Sparkles } from "lucide-react"; 

import FeedbackCard from "@/components/chat/FeedbackCard";

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]); 
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function LiveInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const jobRole = searchParams.get("role") || "Candidate";
  const companyContext = searchParams.get("context") || "General";
  const jobDescription = searchParams.get("desc") || "";

  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [aiText, setAiText] = useState("Connecting to interviewer...");
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [step, setStep] = useState(0);
  
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isAiTalkingRef = useRef(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/chat");
    ws.current = socket;

    socket.onopen = () => {
      setStatus("connected");
      setAiText("Connection established. Please introduce yourself.");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "audio") {
          setAiText(data.text);
          setStep(data.interview_step);

          if (data.is_finished) {
             const showFeedback = () => {
                 setIsAiTalking(false);
                 isAiTalkingRef.current = false;
                 setFeedback(data.feedback); 
             };

             if (data.audio && audioPlayerRef.current) {
                isAiTalkingRef.current = true;
                setIsAiTalking(true);
                audioPlayerRef.current.src = `data:audio/mp3;base64,${data.audio}`;
                audioPlayerRef.current.play();
                audioPlayerRef.current.onended = showFeedback;
             } else {
                showFeedback();
             }
             return;
          }
          
          if (data.audio && audioPlayerRef.current) {
            isAiTalkingRef.current = true;
            setIsAiTalking(true);
            
            audioPlayerRef.current.src = `data:audio/mp3;base64,${data.audio}`;
            audioPlayerRef.current.play();
            
            audioPlayerRef.current.onended = () => {
              isAiTalkingRef.current = false;
              setIsAiTalking(false);
            };
          }
        }
      } catch (e) {
        console.error("WS Error", e);
      }
    };

    socket.onclose = () => setStatus("disconnected");

    return () => socket.close();
  }, [router]);

  const { isListening, isSpeaking, start, stop } = useVAD({
    minVolume: 0.1,
    silenceDuration: 2000,
    
    onSpeechStart: () => {
      if (isAiTalkingRef.current || feedback) return;
    },

    onSpeechEnd: async (blob) => {
      if (isAiTalkingRef.current || feedback) return; 
      if (blob.size < 3000) return;

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const base64Audio = await blobToBase64(blob);
        
        const payload = {
          type: "audio",
          payload: base64Audio,
          job_role: jobRole,
          company_context: companyContext,
          job_description: jobDescription,
          interview_step: step
        };
        
        ws.current.send(JSON.stringify(payload));
      }
    }
  });

  return (
    <div className="flex h-screen flex-col bg-gray-50 font-sans">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                   <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                   <h1 className="text-sm font-bold text-gray-900 leading-tight">{jobRole}</h1>
                   <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      <span>{companyContext}</span>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 ${
                status === "connected" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
             }`}>
                <div className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                {status === "connected" ? "LIVE CONNECTED" : "OFFLINE"}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden overflow-y-auto">
        
        {feedback ? (
            <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-center mb-6">
                    <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Analysis Complete
                    </span>
                </div>
                <FeedbackCard feedback={feedback} onRestart={() => router.push("/")} />
            </div>
        ) : (
            <>
                {isAiTalking && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="absolute w-[500px] h-[500px] bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                )}

                <div className="max-w-3xl w-full text-center mb-12 z-10 min-h-[100px] flex items-center justify-center">
                <p className={`text-2xl md:text-3xl font-medium leading-relaxed transition-all duration-500 ${isAiTalking ? "text-gray-900" : "text-gray-400"}`}>
                    {aiText}
                </p>
                </div>

                <div className="relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
                    {isAiTalking && (
                        <>
                            <div className="absolute w-64 h-64 rounded-full border-2 border-purple-200 animate-ping opacity-20"></div>
                            <div className="absolute w-48 h-48 rounded-full border border-purple-300 animate-ping delay-100 opacity-30"></div>
                        </>
                    )}
                    {isSpeaking && (
                        <div className="absolute w-40 h-40 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    )}
                </div>

                <button 
                    onClick={isListening ? stop : start}
                    className={`relative w-32 h-32 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform ${
                        isAiTalking 
                        ? "bg-white border-4 border-purple-500 scale-105" 
                        : isSpeaking 
                            ? "bg-green-500 scale-110 ring-4 ring-green-200" 
                            : isListening 
                                ? "bg-white border border-gray-200 hover:scale-105"
                                : "bg-gray-200"
                    }`}
                >
                    {isAiTalking ? (
                        <Volume2 className="h-12 w-12 text-purple-600 animate-bounce" />
                    ) : (
                        <Mic className={`h-12 w-12 ${isSpeaking ? "text-white" : "text-gray-400"}`} />
                    )}
                </button>
                </div>

                <div className="mt-8 text-center space-y-2 z-10">
                <h2 className="text-xl font-semibold text-gray-800">
                    {isAiTalking ? "Interviewer is speaking..." : isSpeaking ? "Listening to you..." : "Waiting..."}
                </h2>
                <p className="text-sm text-gray-500">
                    {isAiTalking ? "Please wait" : isListening ? "Go ahead, I'm listening" : "Mic is off"}
                </p>
                </div>

                <div className="absolute bottom-10 z-20">
                    <button 
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all font-medium text-sm"
                    >
                    <PhoneOff className="h-4 w-4" />
                    End Session
                    </button>
                </div>
            </>
        )}
      </main>
      
      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
}

export default function LiveInterviewPage() {
    return (
      <Suspense fallback={<div className="h-screen bg-gray-900 flex items-center justify-center text-white">Initializing connection...</div>}>
        <LiveInterviewContent />
      </Suspense>
    );
  }