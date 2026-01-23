import pdfplumber
import docx
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([p.text for p in doc.paragraphs])


def extract_text(file_bytes: bytes, content_type: str) -> str:
    if content_type == "application/pdf":
        return extract_text_from_pdf(file_bytes)
    else:
        return extract_text_from_docx(file_bytes)
