import React from "react";
import { motion } from "framer-motion";
import { FiUser, FiCpu, FiFile, FiFolder } from "react-icons/fi";

export interface MessageProps {
  content: string;
  sender: "user" | "assistant";
  timestamp?: Date;
}

const Message: React.FC<MessageProps> = ({
  content,
  sender,
  timestamp = new Date(),
}) => {
  const isUser = sender === "user";

  // Parse file or folder lists
  const renderContent = () => {
    // If the message contains a file listing
    if (
      content.includes("[") &&
      content.includes("]") &&
      (content.toLowerCase().includes("file") ||
        content.toLowerCase().includes("folder"))
    ) {
      try {
        // Try to identify and parse file listings
        const contentParts = content.split(/(\[.*?\])/g);

        return (
          <>
            {contentParts.map((part, index) => {
              if (part.startsWith("[") && part.endsWith("]")) {
                // This is likely a file or folder list
                try {
                  const items = JSON.parse(part.replace(/'/g, '"'));
                  return (
                    <div
                      key={index}
                      className="mt-3 p-2 bg-secondary-50 rounded-lg"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.map((item: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center p-2 bg-white rounded-lg shadow-soft"
                          >
                            {item.includes(".") ? (
                              <FiFile className="text-primary-400 mr-2" />
                            ) : (
                              <FiFolder className="text-accent mr-2" />
                            )}
                            <span className="text-sm font-medium truncate">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (e) {
                  // Not valid JSON, render as text
                  return <span key={index}>{part}</span>;
                }
              } else {
                return <span key={index}>{part}</span>;
              }
            })}
          </>
        );
      } catch (e) {
        // Fall back to plain text if parsing fails
        return <p>{content}</p>;
      }
    }

    // Regular text message
    return <p>{content}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex max-w-[85%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUser
                ? "bg-primary-100 text-primary-600"
                : "bg-secondary-100 text-secondary-600"
            }`}
          >
            {isUser ? <FiUser size={18} /> : <FiCpu size={18} />}
          </div>
        </div>

        <div>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser ? "bg-primary-500 text-white" : "glass-panel"
            }`}
          >
            {renderContent()}
          </div>
          <div
            className={`text-xs text-secondary-400 mt-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
