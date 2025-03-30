from fastapi import FastAPI, Request
from pydantic import BaseModel
import os

app = FastAPI()

@app.get("/schema")
def get_schema():
    return {
        "tools": [
            {
                "name": "list_files",
                "description": "List files in a directory",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "directory": {
                            "type": "string",
                            "description": "The path to the directory"
                        }
                    },
                    "required": ["directory"]
                }
            },
            {
                "name": "read_file",
                "description": "Read contents of a file",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "The full path to the file"
                        }
                    },
                    "required": ["file_path"]
                }
            }
        ]
    }

class InvokeRequest(BaseModel):
    tool: str
    input: dict

@app.post("/invoke")
def invoke_tool(req: InvokeRequest):
    if req.tool == "list_files":
        try:
            return {"output": os.listdir(req.input["directory"])}
        except Exception as e:
            return {"error": str(e)}

    elif req.tool == "read_file":
        try:
            file_path = req.input["file_path"].strip().strip('"').strip("'")
            with open(file_path, "r", encoding="utf-8") as f:
                return {"output": f.read()}
        except Exception as e:
            return {"error": str(e)}

    return {"error": "Unknown tool"}
