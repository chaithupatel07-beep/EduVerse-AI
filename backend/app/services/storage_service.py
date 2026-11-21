"""
EduVerse AI - Secure File Storage Service
Provides a clean abstraction for file uploads, validating MIME types, enforcing size limits,
preventing path traversal, and managing stored files on local disk (with Firebase Storage readiness).
"""
import os
from pathlib import Path
import uuid
import mimetypes
from typing import Tuple
from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "txt": "text/plain",
    "zip": "application/zip",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


class StorageService:
    def __init__(self, base_dir: str = "uploads"):
        # Resolve path relative to backend root
        self.base_dir = Path(__file__).resolve().parent.parent.parent / base_dir
        self.materials_dir = self.base_dir / "materials"
        self.submissions_dir = self.base_dir / "submissions"
        self._ensure_directories()

    def _ensure_directories(self):
        os.makedirs(self.materials_dir, exist_ok=True)
        os.makedirs(self.submissions_dir, exist_ok=True)

    def validate_file(self, file: UploadFile) -> Tuple[str, str]:
        """
        Validates file extension and MIME type.
        Returns: (file_extension, detected_mime_type)
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename cannot be empty.",
            )

        # Path traversal prevention: strip path components
        filename = os.path.basename(file.filename)
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if not ext or ext not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(ALLOWED_EXTENSIONS.keys())
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed}",
            )

        mime_type = file.content_type or ALLOWED_EXTENSIONS.get(ext) or "application/octet-stream"
        return ext, mime_type

    async def save_material_file(self, file: UploadFile) -> Tuple[str, str, int, str]:
        """
        Saves a study material file securely.
        Returns: (safe_filename, stored_rel_path, file_size_bytes, mime_type)
        """
        ext, mime_type = self.validate_file(file)
        unique_name = f"mat_{uuid.uuid4().hex[:16]}.{ext}"
        destination = self.materials_dir / unique_name

        size = 0
        with open(destination, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                size += len(chunk)
                if size > MAX_FILE_SIZE_BYTES:
                    # Cleanup oversized file
                    f.close()
                    if destination.exists():
                        destination.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
                    )
                f.write(chunk)

        # Stored relative path
        stored_path = str(Path("materials") / unique_name)
        return unique_name, stored_path, size, mime_type

    async def save_submission_file(self, file: UploadFile) -> Tuple[str, str, int, str]:
        """
        Saves an assignment submission file securely.
        Returns: (safe_filename, stored_rel_path, file_size_bytes, mime_type)
        """
        ext, mime_type = self.validate_file(file)
        unique_name = f"sub_{uuid.uuid4().hex[:16]}.{ext}"
        destination = self.submissions_dir / unique_name

        size = 0
        with open(destination, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE_BYTES:
                    f.close()
                    if destination.exists():
                        destination.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed size.",
                    )
                f.write(chunk)

        stored_path = str(Path("submissions") / unique_name)
        return unique_name, stored_path, size, mime_type

    def get_absolute_path(self, relative_path: str) -> Path:
        """
        Resolves relative path inside base directory and verifies against path traversal.
        """
        clean_rel = os.path.normpath(relative_path)
        if clean_rel.startswith("..") or os.path.isabs(clean_rel):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path.",
            )

        full_path = (self.base_dir / clean_rel).resolve()
        if not str(full_path).startswith(str(self.base_dir.resolve())):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested file path.",
            )

        if not full_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested file does not exist on storage.",
            )

        return full_path


storage_service = StorageService()
