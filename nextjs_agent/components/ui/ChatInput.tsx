import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiMic, FiLoader } from "react-icons/fi";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask me anything...",
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl shadow-soft border border-secondary-100 p-2">
      <form onSubmit={handleSubmit} className="flex items-end">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none max-h-[120px] border-0 outline-none focus:ring-0 bg-transparent p-2 text-secondary-800"
          rows={1}
          disabled={isLoading}
        />
        <div className="flex space-x-2 p-1">
          <button
            type="button"
            className="p-2 rounded-full text-secondary-500 hover:bg-secondary-100 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <FiMic />
          </button>
          <button
            type="submit"
            className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-70"
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
