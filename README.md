# MCP Agent Starter Project

This project demonstrates a simple, working architecture for building LLM agents that use tools via a custom HTTP-based MCP server.

## What's Included

- `mcp_server`: A FastAPI-based HTTP server exposing tools like `list_files` and `read_file`.
- `nextjs_agent`: A Next.js frontend with an API route to talk to the LLM (e.g. OpenRouter) and forward tool calls to the MCP server.

## Running the MCP Server

```bash
cd mcp_server
uvicorn server:app --reload --port 3001
```

## Next Steps

- Fill in the `ask.ts` API to call OpenRouter and forward tool calls to the MCP server.
- Extend the MCP server with more tools (Google APIs, databases, etc.)
