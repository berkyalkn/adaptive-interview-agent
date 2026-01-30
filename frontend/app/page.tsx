"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Briefcase } from "lucide-react";

import InterviewSetup from "@/components/chat/InterviewSetup";
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

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, feedback]);


  const startInterview = async () => {
    if (!jobRole.trim()) return;
    setLoading(true);
    
    try {
      const res = await axios.post<ChatResponse>("http://localhost:8000/chat", {
        job_role: jobRole,
        messages: [],
        interview_step: 0,
      });

      setMessages([{ role: "ai", content: res.data.response_text }]);
      setStep(res.data.interview_step);
      setIsStarted(true);
    } catch (error) {
      console.error("Init Error:", error);
      alert("Could not connect to Backend!");
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


  if (!isStarted) {
    return (
      <InterviewSetup 
        jobRole={jobRole}
        setJobRole={setJobRole}
        onStart={startInterview}
        loading={loading}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">
              Interview: <span className="text-blue-600">{jobRole}</span>
            </h1>
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
              onRestart={() => window.location.reload()} 
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