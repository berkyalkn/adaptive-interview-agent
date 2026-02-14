"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Briefcase, Building2 } from "lucide-react"; 

import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatInput from "@/components/chat/ChatInput";
import FeedbackCard from "@/components/chat/FeedbackCard";

type Message = {
  role: "user" | "ai";
  content: string;
};

type ChatResponse = {
  response_text: string;
  interview_step: number;
  is_finished: boolean;
  feedback: string | null;
};

function TextInterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roleFromUrl = searchParams.get("role") || "";
  const contextFromUrl = searchParams.get("context") || "General Tech"; 

  const [jobRole] = useState(roleFromUrl);
  const [companyContext] = useState(contextFromUrl);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const hasStarted = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, feedback]);

  useEffect(() => {
    if (!roleFromUrl) {
      router.push("/");
      return;
    }

    if (!hasStarted.current) {
      startInterview(roleFromUrl, contextFromUrl);
      hasStarted.current = true;
    }
  }, [roleFromUrl, contextFromUrl, router]);


  const startInterview = async (role: string, context: string) => {
    setLoading(true);
    try {
      const res = await axios.post<ChatResponse>("http://localhost:8000/chat", {
        job_role: role,
        company_context: context,
        messages: [],
        interview_step: 0,
      });

      setMessages([{ role: "ai", content: res.data.response_text }]);
      setStep(res.data.interview_step);
    } catch (error) {
      console.error("Init Error:", error);
      alert("Backend Connection Failed!");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput(""); 
    setLoading(true);

    try {
      const res = await axios.post<ChatResponse>("http://localhost:8000/chat", {
        job_role: jobRole,
        company_context: companyContext, 
        user_input: userMsg.content,
        messages: messages,
        interview_step: step,
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: res.data.response_text },
      ]);
      
      setStep(res.data.interview_step);

      if (res.data.is_finished && res.data.feedback) {
        setFeedback(res.data.feedback);
      }
    } catch (error) {
      console.error("Message Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  {jobRole}
                </h1>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="h-3 w-3" />
                  <span>{companyContext}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
            Step: {step}/4
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              role={msg.role} 
              content={msg.content} 
            />
          ))}
          
          {loading && <TypingIndicator />}
          
          {feedback && (
            <FeedbackCard 
              feedback={feedback} 
              onRestart={() => router.push("/")} 
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {!feedback && (
        <ChatInput 
          input={input} 
          setInput={setInput} 
          onSend={sendMessage} 
          loading={loading}
        />
      )}
    </div>
  );
}


export default function TextInterviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading interview...</div>}>
      <TextInterviewContent />
    </Suspense>
  );
}