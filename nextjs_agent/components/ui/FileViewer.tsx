import React from "react";
import { FiFile, FiDownload, FiCopy, FiMaximize2 } from "react-icons/fi";

interface FileViewerProps {
  fileName: string;
  content: string;
  type?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  fileName,
  content,
  type = "text",
}) => {
  // Function to determine file type icon and styling
  const getFileType = () => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (["js", "jsx", "ts", "tsx"].includes(extension || "")) {
      return { color: "bg-yellow-100 text-yellow-700", name: "JavaScript" };
    } else if (["py"].includes(extension || "")) {
      return { color: "bg-blue-100 text-blue-700", name: "Python" };
    } else if (["json"].includes(extension || "")) {
      return { color: "bg-green-100 text-green-700", name: "JSON" };
    } else if (["html", "htm"].includes(extension || "")) {
      return { color: "bg-orange-100 text-orange-700", name: "HTML" };
    } else if (["css", "scss", "sass"].includes(extension || "")) {
      return { color: "bg-purple-100 text-purple-700", name: "CSS" };
    } else if (["md", "markdown"].includes(extension || "")) {
      return { color: "bg-gray-100 text-gray-700", name: "Markdown" };
    } else if (["jpg", "jpeg", "png", "gif", "svg"].includes(extension || "")) {
      return { color: "bg-pink-100 text-pink-700", name: "Image" };
    } else {
      return { color: "bg-gray-100 text-gray-700", name: "Text" };
    }
  };

  const fileType = getFileType();

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="glass-panel overflow-hidden mt-4">
      <div className="flex items-center justify-between p-3 border-b border-secondary-100">
        <div className="flex items-center">
          <div className="p-2 rounded-lg mr-3">
            <FiFile className="text-primary-500" />
          </div>
          <div>
            <h3 className="font-medium text-secondary-800">{fileName}</h3>
            <div
              className={`text-xs px-2 py-0.5 rounded ${fileType.color} inline-block`}
            >
              {fileType.name}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-full hover:bg-secondary-100 text-secondary-600"
            title="Copy content"
          >
            <FiCopy size={16} />
          </button>
          <button
            className="p-1.5 rounded-full hover:bg-secondary-100 text-secondary-600"
            title="Download file"
          >
            <FiDownload size={16} />
          </button>
          <button
            className="p-1.5 rounded-full hover:bg-secondary-100 text-secondary-600"
            title="Expand"
          >
            <FiMaximize2 size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-96">
        {type === "text" ? (
          <pre className="p-4 text-sm font-mono text-secondary-800 whitespace-pre-wrap">
            {content}
          </pre>
        ) : type === "image" ? (
          <div className="p-4 flex justify-center">
            <img
              src={content}
              alt={fileName}
              className="max-w-full max-h-80 object-contain"
            />
          </div>
        ) : (
          <div className="p-4 text-sm text-secondary-600">
            File preview not available
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
