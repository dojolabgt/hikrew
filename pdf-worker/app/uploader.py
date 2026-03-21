"""Google Drive uploader for PDF files."""
import io
import logging
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from app.config import settings

log = logging.getLogger(__name__)

MIME_PDF = "application/pdf"
MIME_FOLDER = "application/vnd.google-apps.folder"


def _build_service(access_token: str, refresh_token: str):
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )
    # Refresh if needed
    if not creds.valid:
        creds.refresh(Request())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def _get_or_create_folder(service, name: str, parent_id: str | None) -> str:
    """Return existing folder ID or create a new one."""
    query = f"name='{name}' and mimeType='{MIME_FOLDER}' and trashed=false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    results = service.files().list(q=query, fields="files(id,name)").execute()
    files = results.get("files", [])
    if files:
        return files[0]["id"]

    metadata = {"name": name, "mimeType": MIME_FOLDER}
    if parent_id:
        metadata["parents"] = [parent_id]
    folder = service.files().create(body=metadata, fields="id").execute()
    return folder["id"]


def upload_pdfs(job: dict, pdfs: dict[str, bytes]) -> dict[str, str]:
    """
    Upload PDFs to Drive.  Returns {filename: fileId}.

    pdfs = {"quotation.pdf": <bytes>, "brief-name.pdf": <bytes>, ...}
    """
    access_token = job.get("accessToken")
    refresh_token = job.get("refreshToken")

    if not access_token or not refresh_token:
        log.warning("No Drive credentials in job — skipping upload")
        return {}

    service = _build_service(access_token, refresh_token)

    # Resolve the project folder
    folder_id: str | None = job.get("driveFolderId")
    if not folder_id:
        root_folder_id: str | None = job.get("driveRootFolderId")
        project_name = job.get("projectName", "Project")
        folder_id = _get_or_create_folder(service, project_name, root_folder_id)
        log.info("Created/found project Drive folder: %s", folder_id)

    uploaded: dict[str, str] = {}
    for filename, content in pdfs.items():
        metadata = {"name": filename, "parents": [folder_id]}
        media = MediaIoBaseUpload(io.BytesIO(content), mimetype=MIME_PDF, resumable=False)
        file = (
            service.files()
            .create(body=metadata, media_body=media, fields="id")
            .execute()
        )
        uploaded[filename] = file["id"]
        log.info("Uploaded %s → Drive file %s", filename, file["id"])

    return uploaded
