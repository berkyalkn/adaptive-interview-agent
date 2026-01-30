import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  loading: boolean;
}

export default function ChatInput({ input, setInput, onSend, loading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
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
          onClick={onSend}
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
  );
}