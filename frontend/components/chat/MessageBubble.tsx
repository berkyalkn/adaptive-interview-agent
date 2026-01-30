import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "ai";
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-4 rounded-2xl p-5 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
        }`}
      >
        <div className="shrink-0 mt-1">
          {isUser ? (
            <User className="h-5 w-5 text-blue-200" />
          ) : (
            <Bot className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}