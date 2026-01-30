import { Briefcase } from "lucide-react";

interface InterviewSetupProps {
  jobRole: string;
  setJobRole: (role: string) => void;
  onStart: () => void;
  loading: boolean;
}

export default function InterviewSetup({ jobRole, setJobRole, onStart, loading }: InterviewSetupProps) {
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
            onKeyDown={(e) => e.key === "Enter" && onStart()}
          />
          <button
            onClick={onStart}
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