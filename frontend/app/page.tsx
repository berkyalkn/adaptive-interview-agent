"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MessageSquare, Mic, Radio } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState("");

  const handleStart = (mode: "text" | "voice-ptt" | "voice-live") => {
    if (!jobRole.trim()) {
      alert("Please enter a job position first!");
      return;
    }
    router.push(`/interview/${mode}?role=${encodeURIComponent(jobRole)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-12">
        
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Briefcase className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            AI Interview Simulator
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Master your interview skills with realistic AI-driven simulations before the big day.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Job Position
          </label>
          <input
            type="text"
            className="block w-full rounded-xl border-0 py-4 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg"
            placeholder="e.g. Senior Product Manager"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <button
            onClick={() => handleStart("text")}
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center"
          >
            <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Text Interview</h3>
            <p className="text-gray-500 text-sm">
              Classic text-based chat. Answer questions using your keyboard.
            </p>
          </button>

          <button
            disabled
            className="group relative flex flex-col items-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 opacity-70 cursor-not-allowed"
          >
            <div className="h-14 w-14 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mb-4">
              <Mic className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">Voice (Push-to-Talk)</h3>
            <p className="text-gray-400 text-sm">
              Speak your answers. Powered by Whisper STT and advanced TTS.
            </p>
            <span className="absolute top-4 right-4 text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
              COMING SOON
            </span>
          </button>

          <button
            disabled
            className="group relative flex flex-col items-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 opacity-70 cursor-not-allowed"
          >
            <div className="h-14 w-14 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mb-4">
              <Radio className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">Live Real-time</h3>
            <p className="text-gray-400 text-sm">
              Seamless, real-time conversational experience via WebSockets.
            </p>
            <span className="absolute top-4 right-4 text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
              COMING SOON
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}