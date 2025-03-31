from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

app = FastAPI()

SCOPES = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file'
]

CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")



# 🧠 Get authorized Google Drive service
def get_drive_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return build("drive", "v3", credentials=creds)


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
            },
            {
                "name": "list_drive_files",
                "description": "List file names from your Google Drive (top 10 files)",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
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

    elif req.tool == "list_drive_files":
        try:
            service = get_drive_service()
            results = service.files().list(pageSize=10).execute()
            files = results.get("files", [])
            return {"output": [f["name"] for f in files]}
        except Exception as e:
            return {"error": str(e)}

    return {"error": "Unknown tool"}
