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

// Temp session memory (in-memory, clears on restart)
const sessionMemory: {
  messages: any[];
} = {
  messages: [],
};

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

    // Add the user message to memory
    sessionMemory.messages.push({ role: "user", content: userMessage });

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
      {
        type: "function",
        function: {
          name: "list_recent_emails",
          description: "List recent emails with sender, subject, and time.",
          parameters: {
            type: "object",
            properties: {
              max_results: {
                type: "integer",
                description: "Number of emails to retrieve",
              },
            },
            required: ["max_results"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "read_emails",
          description:
            "Read emails with optional filters like sender, max count, or how recent.",
          parameters: {
            type: "object",
            properties: {
              sender: {
                type: "string",
                description: "Email address of the sender (optional)",
              },
              max_results: {
                type: "integer",
                description: "Maximum number of emails to return (optional)",
              },
              since_days: {
                type: "integer",
                description:
                  "Number of days ago to filter emails from (optional)",
              },
            },
            required: [],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "send_email",
          description:
            "Send an email to a specific recipient. In case no subject line is giving, write the best fitting one",
          parameters: {
            type: "object",
            properties: {
              to: { type: "string", description: "Recipient email address" },
              subject: { type: "string", description: "Subject of the email" },
              body: {
                type: "string",
                description: "Plain text body of the email",
              },
            },
            required: ["to", "subject", "body"],
          },
        },
      },
    ];

    console.log("Sending request to OpenRouter with message:", userMessage);

    // Main interaction loop with tool call support
    let done = false;
    let finalResponse = null;

    while (!done) {
      const response = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content:
              "You're a helpful AI agent connected to various tools via MCP.",
          },
          ...sessionMemory.messages,
        ],
        tools,
        tool_choice: "auto",
      });

      const msg = response.choices[0].message;

      // If it's a normal message — end the loop
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        sessionMemory.messages.push(msg);
        finalResponse = msg.content;
        done = true;
        break;
      }

      // If there's a tool call, resolve it and loop again
      for (const toolCall of msg.tool_calls) {
        const fn = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const result = await callMcpTool(fn, args);

        // Save both tool call and result in memory
        sessionMemory.messages.push({
          role: "assistant",
          tool_calls: [toolCall],
        });
        sessionMemory.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return res.status(200).json({ response: finalResponse });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
