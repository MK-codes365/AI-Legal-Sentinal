from fastapi import UploadFile, File

ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]

def validate_file(file: UploadFile):
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError("Unsupported file type")
