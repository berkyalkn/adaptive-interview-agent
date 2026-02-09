import { Mic, Square, Volume2 } from "lucide-react";

interface VoiceControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function VoiceControls({
  isRecording,
  isProcessing,
  isPlaying,
  onStartRecording,
  onStopRecording,
}: VoiceControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 z-20">
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
        
        <div className="text-sm font-medium text-gray-500 h-6">
          {isRecording ? (
            <span className="text-red-500 animate-pulse flex items-center gap-2">
              <span className="h-2 w-2 bg-red-500 rounded-full" /> Recording...
            </span>
          ) : isProcessing ? (
            <span className="text-blue-500 animate-pulse">Processing...</span>
          ) : isPlaying ? (
            <span className="text-green-500 flex items-center gap-2 animate-pulse">
              <Volume2 className="h-4 w-4" /> AI Speaking...
            </span>
          ) : (
            "Ready to speak"
          )}
        </div>

        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isProcessing || isPlaying}
          className={`
            h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
            ${
              isRecording
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
          {isRecording
            ? "Tap to send answer"
            : "Tap microphone to start speaking"}
        </p>
      </div>
    </div>
  );
}