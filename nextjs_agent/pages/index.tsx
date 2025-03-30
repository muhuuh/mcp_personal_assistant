import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import Message, { MessageProps } from "../components/ui/Message";
import ChatInput from "../components/ui/ChatInput";
import FileViewer from "../components/ui/FileViewer";
import {
  FiInfo,
  FiCommand,
  FiFolderPlus,
  FiMail,
  FiCalendar,
  FiCloud,
} from "react-icons/fi";

export default function Home() {
  const [messages, setMessages] = useState<MessageProps[]>([
    {
      content:
        "Hello! I'm your personal AI assistant. I can help you access your files, emails, and more. How can I assist you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to API
  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: MessageProps = {
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to chat
      const assistantMessage: MessageProps = {
        content: data.response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Handle error
      const errorMessage: MessageProps = {
        content: "Sorry, I encountered an error. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick suggestion chips
  const suggestions = [
    { text: "Show files in my documents", icon: <FiCommand /> },
    { text: "Read my latest emails", icon: <FiMail /> },
    { text: "Check my calendar", icon: <FiCalendar /> },
    { text: "Access my Google Drive", icon: <FiCloud /> },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          Personal Assistant
        </h1>
        <button className="btn-secondary flex items-center">
          <FiInfo className="mr-2" />
          Help
        </button>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar with capabilities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <div className="glass-panel p-5">
            <h2 className="text-lg font-semibold mb-4">Capabilities</h2>

            <div className="space-y-3">
              <div className="flex items-center p-3 rounded-xl bg-primary-50 border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                  <FiFolderPlus />
                </div>
                <div>
                  <h3 className="font-medium text-primary-700">File Access</h3>
                  <p className="text-sm text-primary-600">
                    Browse and read files from your computer
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 rounded-xl bg-secondary-50 border border-secondary-100 opacity-60">
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 mr-3">
                  <FiMail />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-700">
                    Email Integration
                  </h3>
                  <p className="text-sm text-secondary-500">Coming soon</p>
                </div>
              </div>

              <div className="flex items-center p-3 rounded-xl bg-secondary-50 border border-secondary-100 opacity-60">
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 mr-3">
                  <FiCalendar />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-700">Calendar</h3>
                  <p className="text-sm text-secondary-500">Coming soon</p>
                </div>
              </div>

              <div className="flex items-center p-3 rounded-xl bg-secondary-50 border border-secondary-100 opacity-60">
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 mr-3">
                  <FiCloud />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-700">
                    Cloud Storage
                  </h3>
                  <p className="text-sm text-secondary-500">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main chat area */}
        <div className="lg:col-span-2">
          {/* Messages container */}
          <div className="glass-panel p-6 mb-4 min-h-[500px] max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  content={msg.content}
                  sender={msg.sender}
                  timestamp={msg.timestamp}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggestion chips */}
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => handleSendMessage(suggestion.text)}
                  className="btn-secondary flex items-center text-sm"
                  disabled={isLoading}
                >
                  <span className="mr-2">{suggestion.icon}</span>
                  {suggestion.text}
                </motion.button>
              ))}
            </div>
          )}

          {/* Input area */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Ask about your files, emails, calendar, etc..."
          />
        </div>
      </div>
    </Layout>
  );
}
