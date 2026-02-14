"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MessageSquare, Mic, Radio, Building2} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState("");
  const [companyContext, setCompanyContext] = useState("Software / SaaS");

  const industries = [
    "Software / SaaS",
    "Fintech / Banking",
    "Gaming / GameDev",
    "E-commerce / Retail",
    "Cybersecurity / Defense",
    "Data / AI & Analytics",
    "Healthcare / MedTech",
    "Digital Marketing / AdTech",
    "Creative Agencies / Design",
    "Construction / Architecture",
    "Manufacturing / Industry 4.0",
    "Education / EdTech",
    "Consulting / Strategy",
    "Government / Public Sector"
  ];

  const handleStart = (mode: "text" | "voice-ptt" | "voice-live") => {
    if (!jobRole.trim()) {
      alert("Please enter a job position first!");
      return;
    }

    const params = new URLSearchParams({
      role: jobRole,
      context: companyContext,
    });
    
    router.push(`/interview/${mode}?${params.toString()}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full space-y-12">
        
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Briefcase className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            AI Interview Simulator
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Master your interview skills with realistic AI-driven simulations tailored to your industry.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Job Position
            </label>
            <div className="relative">
              <input
                type="text"
                className="block w-full rounded-xl border-0 py-4 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg"
                placeholder="e.g. Senior Java Dev"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry / Context
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={companyContext}
                onChange={(e) => setCompanyContext(e.target.value)}
                className="block w-full rounded-xl border-0 py-4 pl-12 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-lg bg-white appearance-none cursor-pointer"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          <button
            onClick={() => handleStart("text")}
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center"
          >
            <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Text Interview</h3>
            <p className="text-gray-500 text-sm">
              Classic chat interface. Best for practicing technical definitions and writing code snippets.
            </p>
          </button>

          <button
            onClick={() => handleStart("voice-ptt")}
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-xl transition-all duration-300 text-center"
          >
            <div className="h-14 w-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Mic className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Voice (Push-to-Talk)</h3>
            <p className="text-gray-500 text-sm">
              Control the flow manually. Press to speak, release to send. Good for noisy environments.
            </p>
          </button>

          <button
            onClick={() => handleStart("voice-live")}
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-md border-2 border-rose-100 hover:border-rose-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center"
          >

            <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors animate-pulse group-hover:animate-none">
              <Radio className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live Real-time</h3>
            <p className="text-gray-500 text-sm">
              Hands-free, interruptible conversation. The most realistic interview simulation experience.
            </p>
          </button>

        </div>
      </div>
    </div>
  );
}