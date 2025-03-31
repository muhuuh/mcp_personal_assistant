import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

// Initialize OpenAI client with OpenRouter settings
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // Required for OpenRouter
    "X-Title": "Local MCP App", // Title of your app
  },
});

// Function to call the MCP server
// Corrected function to call the MCP HTTP server
async function callMcpTool(toolName: string, params: any) {
  try {
    console.log(`Calling MCP tool: ${toolName} with params:`, params);

    const response = await fetch("http://localhost:3001/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool: toolName,
        input: params,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `MCP server responded with ${response.status}: ${await response.text()}`
      );
    }

    const result = await response.json();
    console.log(`MCP tool ${toolName} response:`, result);
    return result.output;
  } catch (error: any) {
    console.error(`Error calling MCP tool ${toolName}:`, error);
    // Check if this is a connection refused error, which likely means the MCP server isn't running
    if (error.cause?.code === "ECONNREFUSED") {
      return {
        error:
          "Could not connect to the MCP server. Please make sure it's running on port 3001 with 'python local_file_server.py'.",
      };
    }
    return { error: error.message || String(error) };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Define the MCP function schema as tools
    const tools: ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "list_files",
          description: "List files in a directory",
          parameters: {
            type: "object",
            properties: {
              directory: { type: "string", description: "Path to the folder" },
            },
            required: ["directory"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "read_file",
          description: "Read contents of a text file",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Full path to the file",
              },
            },
            required: ["file_path"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "list_drive_files",
          description:
            "List file names from your Google Drive (by folder name)",
          parameters: {
            type: "object",
            properties: {
              folder_name: {
                type: "string",
                description: "The name of the folder to list files from",
              },
            },
            required: [],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "read_drive_file",
          description: "Read the content of a Google Drive file (by file name)",
          parameters: {
            type: "object",
            properties: {
              file_name: {
                type: "string",
                description: "Name of the file to read",
              },
              folder_name: {
                type: "string",
                description: "Optional folder to limit file lookup",
              },
            },
            required: ["file_name"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "upload_drive_file",
          description: "Upload a local file to Google Drive",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to upload",
              },
              drive_filename: {
                type: "string",
                description: "The name to give the file on Google Drive",
              },
            },
            required: ["file_path", "drive_filename"],
          },
        },
      },
    ];

    console.log("Sending request to OpenRouter with message:", userMessage);

    // Using a model that's available on OpenRouter and supports function calling
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content:
            "You're a helpful assistant. You have access to the following tools: 'list_files' (takes a 'directory'), and 'read_file' (takes a 'file_path'). Use these tools via function calls when the user asks about files or folders.",
        },
        { role: "user", content: userMessage },
      ],
      tools: tools,
      tool_choice: "auto",
    });

    const msg = completion.choices[0].message;
    console.log("OpenRouter response:", msg);

    // Handle tool calls (previously function_call)
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      const toolCall = msg.tool_calls[0];
      const fn = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");
      console.log(`Tool call detected: ${fn} with args:`, args);

      // Call the MCP server instead of directly accessing files
      const result = await callMcpTool(fn, args);

      // Send tool result back to LLM for final response
      const secondCall = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content:
              "You're a helpful assistant. You have access to the following tools: 'list_files' (takes a 'directory'), and 'read_file' (takes a 'file_path'). Use these tools when the user asks about files or folders.",
          },
          { role: "user", content: userMessage },
          msg,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          },
        ],
        tools: tools,
      });

      return res
        .status(200)
        .json({ response: secondCall.choices[0].message.content });
    }

    return res.status(200).json({ response: msg.content });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
