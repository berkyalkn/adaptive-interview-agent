import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start w-full">
      <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
        <Bot className="h-5 w-5 text-gray-400 mr-2" />
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75" />
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150" />
      </div>
    </div>
  );
}