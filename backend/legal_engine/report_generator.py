from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO
from datetime import datetime

def generate_pdf_report(data: dict) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#000000"),
        spaceAfter=20,
        alignment=1 # Center
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor("#1e40af"), # blue-800
        spaceBefore=15,
        spaceAfter=10
    )
    
    risk_high = ParagraphStyle('RiskHigh', parent=styles['Normal'], textColor=colors.red, fontName='Helvetica-Bold')
    risk_med = ParagraphStyle('RiskMed', parent=styles['Normal'], textColor=colors.orange, fontName='Helvetica-Bold')
    risk_low = ParagraphStyle('RiskLow', parent=styles['Normal'], textColor=colors.green, fontName='Helvetica-Bold')
    
    elements = []
    
    # Title
    elements.append(Paragraph("Vidhi Setu Analysis Report", title_style))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%d %B, %Y')}", styles['Italic']))
    elements.append(Spacer(1, 20))
    
    # Executive Summary
    elements.append(Paragraph("Executive Summary", section_style))
    summary_data = data.get("summary") or {}
    summary_text = summary_data.get("overview", "No summary available.")
    elements.append(Paragraph(summary_text, styles['Normal']))
    
    # Key Details
    elements.append(Paragraph("Contract Metadata", section_style))
    meta = data.get("summary", {})
    parties = meta.get("parties", "Not detected")
    if isinstance(parties, list):
        parties = ", ".join(parties)
        
    meta_data = [
        ["Field", "Details"],
        ["Parties", parties],
        ["Governing Law", meta.get("governing_law", "Not detected")],
        ["Vesting Schedule", meta.get("vesting_schedule", "N/A")],
        ["Lock-in Period", meta.get("lock_in_period", "N/A")]
    ]
    meta_table = Table(meta_data, colWidths=[150, 300])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    elements.append(meta_table)
    
    # Risk Analysis
    elements.append(Paragraph("Risk Analysis & Legal Checks", section_style))
    risks = data.get("risk_flags", [])
    if not risks:
        elements.append(Paragraph("No significant risks identified.", styles['Normal']))
    else:
        for risk in risks:
            level = risk.get("risk_level", "Low").capitalize()
            style = risk_high if level == "High" else (risk_med if level == "Medium" else risk_low)
            
            elements.append(Paragraph(f"[{level}] {risk.get('title')}", style))
            elements.append(Paragraph(f"Result: {risk.get('reason')}", styles['Normal']))
            
            # Use explain_flag or raw text if available
            explanation = risk.get("explanation", "")
            if explanation:
                elements.append(Paragraph(f"ELI5: {explanation}", styles['Italic']))
            
            elements.append(Spacer(1, 10))
            
    # Structure Check
    elements.append(Paragraph("Structure & Completeness Check", section_style))
    struct = data.get("structure_analysis", {})
    score = struct.get("completeness_score", 0)
    elements.append(Paragraph(f"Overall Completeness Score: {score}/100", styles['Heading3']))
    
    present = [c.get('title') if isinstance(c, dict) else c for c in struct.get("present_clauses", [])]
    missing = [c.get('title') if isinstance(c, dict) else c for c in struct.get("missing_clauses", [])]
    
    elements.append(Paragraph(f"Present Clauses: {', '.join(present)}", styles['Normal']))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(f"Missing Clauses: {', '.join(missing)}", styles['Normal']))
    
    # Build
    doc.build(elements)
    buffer.seek(0)
    return buffer
