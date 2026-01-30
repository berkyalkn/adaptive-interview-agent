interface FeedbackCardProps {
    feedback: string;
    onRestart: () => void;
  }
  
  export default function FeedbackCard({ feedback, onRestart }: FeedbackCardProps) {
    return (
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
              onClick={onRestart}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }