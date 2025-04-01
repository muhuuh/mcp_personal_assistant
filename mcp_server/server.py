from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload
import io

import base64
from email.mime.text import MIMEText
from datetime import datetime

app = FastAPI()

SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
]

CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")

def get_gmail_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    return build("gmail", "v1", credentials=creds)

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

def get_drive_file_id_by_name(service, name, parent_folder_id=None):
    query = f"name = '{name}'"
    if parent_folder_id:
        query += f" and '{parent_folder_id}' in parents"
    results = service.files().list(q=query, spaces='drive', fields="files(id, name)", pageSize=1).execute()
    files = results.get("files", [])
    return files[0]["id"] if files else None


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
                "description": "List file names from your Google Drive (by folder name)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "folder_name": {
                            "type": "string",
                            "description": "The name of the folder to list files from"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "read_drive_file",
                "description": "Read the content of a Google Drive file (by file name)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_name": {
                            "type": "string",
                            "description": "The name of the file to read"
                        },
                        "folder_name": {
                            "type": "string",
                            "description": "Optional folder to limit file lookup"
                        }
                    },
                    "required": ["file_name"]
                }
            },
            {
                "name": "upload_drive_file",
                "description": "Upload a local file to Google Drive",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "Path to the local file"
                        },
                        "drive_filename": {
                            "type": "string",
                            "description": "The name to give the file on Google Drive"
                        }
                    },
                    "required": ["file_path", "drive_filename"]
                }
            },
            {
                "name": "list_recent_emails",
                "description": "List recent emails with sender, subject, and time.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "max_results": {
                            "type": "integer",
                            "description": "Number of recent emails to retrieve"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "read_emails",
                "description": "Read emails with optional filters like sender, max count, or how recent.",
                "parameters": {
                    "type": "object",
                    "properties": {
                    "sender": {
                        "type": "string",
                        "description": "Email address of the sender (optional)"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of emails to return (optional)"
                    },
                    "since_days": {
                        "type": "integer",
                        "description": "Number of days ago to filter emails from (optional)"
                    }
                    },
                    "required": []
                }
            },
            {
                "name": "send_email",
                "description": "Send an email to a specific recipient.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "to": {"type": "string", "description": "Recipient email address"},
                        "subject": {"type": "string", "description": "Subject of the email"},
                        "body": {"type": "string", "description": "Plain text body of the email"}
                    },
                    "required": ["to", "subject", "body"]
                }
            }
        ]
    }

class InvokeRequest(BaseModel):
    tool: str
    input: dict

@app.post("/invoke")
def invoke_tool(req: InvokeRequest):
    service = get_drive_service()

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
            folder_name = req.input.get("folder_name")
            folder_id = get_drive_file_id_by_name(service, folder_name) if folder_name else None
            query = f"'{folder_id}' in parents" if folder_id else None
            results = service.files().list(q=query, pageSize=10, fields="files(id, name)").execute()
            files = results.get("files", [])
            return {"output": [{"id": f["id"], "name": f["name"]} for f in files]}
        except Exception as e:
            return {"error": str(e)}
    elif req.tool == "read_drive_file":
        try:
            file_name = req.input["file_name"]
            folder_name = req.input.get("folder_name")
            folder_id = get_drive_file_id_by_name(service, folder_name) if folder_name else None
            file_id = get_drive_file_id_by_name(service, file_name, parent_folder_id=folder_id)
            if not file_id:
                return {"error": f"File '{file_name}' not found."}

            # Get file metadata to check if it's a Google Doc
            file_metadata = service.files().get(fileId=file_id, fields="mimeType").execute()
            mime_type = file_metadata["mimeType"]

            if mime_type == "application/vnd.google-apps.document":
                # Export Google Docs as plain text
                request = service.files().export_media(fileId=file_id, mimeType="text/plain")
            else:
                # Download normal files
                request = service.files().get_media(fileId=file_id)

            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            fh.seek(0)
            content = fh.read().decode("utf-8")

            return {"output": content}
        except Exception as e:
            return {"error": str(e)}

    elif req.tool == "upload_drive_file":
        try:
            file_path = req.input["file_path"]
            drive_filename = req.input["drive_filename"]
            media = MediaFileUpload(file_path, resumable=True)
            file_metadata = {"name": drive_filename}
            file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
            return {"output": f"Uploaded successfully with ID: {file['id']}"}
        except Exception as e:
            return {"error": str(e)}
    elif req.tool == "list_recent_emails":
        try:
            gmail = get_gmail_service()
            max_results = req.input.get("max_results", 5)
            results = gmail.users().messages().list(userId="me", maxResults=max_results).execute()
            messages = results.get("messages", [])

            output = []
            for msg in messages:
                msg_data = gmail.users().messages().get(userId="me", id=msg["id"], format="metadata", metadataHeaders=["From", "Subject", "Date"]).execute()
                headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
                output.append({
                    "from": headers.get("From"),
                    "subject": headers.get("Subject"),
                    "date": headers.get("Date")
                })
            return {"output": output}
        except Exception as e:
            return {"error": str(e)}

    elif req.tool == "read_emails":
        try:
            gmail = get_gmail_service()
            sender = req.input.get("sender")
            max_results = req.input.get("max_results", 5)
            since_days = req.input.get("since_days")

            # Build query string
            query_parts = []
            if sender:
                query_parts.append(f"from:{sender}")
            if since_days:
                from datetime import datetime, timedelta
                since = (datetime.utcnow() - timedelta(days=since_days)).strftime("%Y/%m/%d")
                query_parts.append(f"after:{since}")
            query = " ".join(query_parts)

            # Fetch messages
            results = gmail.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
            messages = results.get("messages", [])

            emails = []
            for msg in messages:
                msg_data = gmail.users().messages().get(userId="me", id=msg["id"], format="full").execute()
                snippet = msg_data.get("snippet", "")
                headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
                emails.append({
                    "from": headers.get("From"),
                    "subject": headers.get("Subject"),
                    "date": headers.get("Date"),
                    "snippet": snippet
                })
            return {"output": emails}
        except Exception as e:
            return {"error": str(e)}

    elif req.tool == "send_email":
        try:
            gmail = get_gmail_service()
            to = req.input["to"]
            subject = req.input["subject"]
            body = req.input["body"]

            message = MIMEText(body)
            message["to"] = to
            message["subject"] = subject

            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            gmail.users().messages().send(userId="me", body={"raw": raw_message}).execute()
            return {"output": "Email sent successfully."}
        except Exception as e:
            return {"error": str(e)}
    return {"error": "Unknown tool"}
