import pdfplumber
import docx
import io

def process_pdf_content(raw_bytes: bytes) -> str:
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf_doc:
        for page in pdf_doc.pages:
            extracted_text += page.extract_text() or ""
    return extracted_text

def process_docx_content(raw_bytes: bytes) -> str:
    word_doc = docx.Document(io.BytesIO(raw_bytes))
    return "\n".join([para.text for para in word_doc.paragraphs])

def extract_text(raw_bytes: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        return process_pdf_content(raw_bytes)
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return process_docx_content(raw_bytes)
    else:
        # Fallback to plain text for .txt, .md, etc.
        try:
            return raw_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return raw_bytes.decode('latin-1')
