"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, User, Bot, Briefcase } from "lucide-react";

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

      setMessages([
        { role: "ai", content: res.data.response_text }
      ]);
      setStep(res.data.interview_step);
      setIsStarted(true);
    } catch (error) {
      console.error("Initialization Error:", error);
      alert("Could not connect to Backend! Ensure Docker (Backend) is running.");
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
      console.error("Message Delivery Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-6">
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              AI Interview Simulator
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Which position would you like to practice for?
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <input
              type="text"
              required
              className="block w-full rounded-xl border-0 py-4 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
              placeholder="e.g., Senior Python Developer"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startInterview()}
            />
            <button
              onClick={startInterview}
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-blue-600 px-3 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-500 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Preparing..." : "Start Interview"}
            </button>
          </div>
        </div>
      </div>
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
            <div
              key={idx}
              className={`flex w-full ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[85%] md:max-w-[75%] gap-4 rounded-2xl p-5 shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                }`}
              >
                <div className="shrink-0 mt-1">
                  {msg.role === "user" ? (
                    <User className="h-5 w-5 text-blue-200" />
                  ) : (
                    <Bot className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start w-full">
              <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                <Bot className="h-5 w-5 text-gray-400 mr-2" />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          
          {feedback && (
            <div className="mt-10 mb-10 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xl animate-fade-in-up">
              <div className="bg-linear-to-r from-green-600 to-emerald-600 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  📝 Interview Evaluation Report
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  Detailed AI-based performance analysis
                </p>
              </div>
              <div className="p-8">
                <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {feedback}
                </div>
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Start New Interview
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>


      {!feedback && (
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="mx-auto max-w-3xl relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here..."
              className="block w-full resize-none rounded-2xl border-gray-300 py-4 pl-5 pr-14 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center justify-center"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      )}
    </div>
  );
}