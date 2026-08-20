import os
from PIL import Image as PILImage
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
    Table, TableStyle, HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.units import inch, cm
from reportlab.platypus import Frame, PageTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ─── Paths ────────────────────────────────────────────────────────────────────
PDF_OUT  = r"c:\Users\Ninjo\OneDrive\Desktop\LAB1\report_lab01_67070503414_final.pdf"
IMG_DIR  = r"c:\Users\Ninjo\OneDrive\Desktop\LAB1\report_lab01_67070503414.pdf"

# Page dims
PAGE_W, PAGE_H = A4
MARGIN = 2.0 * cm
CONTENT_W = PAGE_W - 2 * MARGIN

# ─── Header / Footer callbacks ────────────────────────────────────────────────
def draw_header_footer(canvas, doc):
    canvas.saveState()
    # Top bar
    canvas.setFillColor(colors.HexColor('#1E40AF'))
    canvas.rect(0, PAGE_H - 1.1*cm, PAGE_W, 1.1*cm, fill=1, stroke=0)
    canvas.setFont('Helvetica-Bold', 9)
    canvas.setFillColor(colors.white)
    canvas.drawString(MARGIN, PAGE_H - 0.75*cm, "CPE 334 Lab 1 — TokTickIT  |  Dechayut  67070503414")
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.75*cm, "github.com/NinjoMUDA/Dechayut_3414Lab1")

    # Bottom bar
    canvas.setFillColor(colors.HexColor('#F1F5F9'))
    canvas.rect(0, 0, PAGE_W, 0.9*cm, fill=1, stroke=0)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748B'))
    canvas.drawString(MARGIN, 0.3*cm, "CPE 334 Introduction to Software Engineering in the Age of AI Agents  |  1/2026")
    canvas.drawRightString(PAGE_W - MARGIN, 0.3*cm, f"Page {doc.page}")
    canvas.restoreState()

# ─── Document ─────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    PDF_OUT,
    pagesize=A4,
    rightMargin=MARGIN,
    leftMargin=MARGIN,
    topMargin=MARGIN + 1.1*cm,
    bottomMargin=MARGIN + 0.9*cm,
)

styles = getSampleStyleSheet()

# ─── Custom Styles ────────────────────────────────────────────────────────────
title_style = ParagraphStyle('Title2',
    parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=20,
    leading=26, textColor=colors.HexColor('#0F172A'), alignment=1, spaceAfter=6)

subtitle_style = ParagraphStyle('Sub2',
    parent=styles['Normal'], fontName='Helvetica', fontSize=10,
    leading=14, textColor=colors.HexColor('#475569'), alignment=1, spaceAfter=4)

h1_style = ParagraphStyle('H1',
    parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=13,
    leading=16, textColor=colors.white, spaceAfter=0, spaceBefore=0)

h2_style = ParagraphStyle('H2',
    parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10.5,
    leading=14, textColor=colors.HexColor('#1D4ED8'), spaceBefore=14, spaceAfter=5)

body_style = ParagraphStyle('Body2',
    parent=styles['Normal'], fontName='Helvetica', fontSize=9,
    leading=13, textColor=colors.HexColor('#334155'), spaceAfter=6)

caption_style = ParagraphStyle('Caption2',
    parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8,
    leading=10, textColor=colors.HexColor('#64748B'), alignment=1,
    spaceBefore=3, spaceAfter=12)

url_style = ParagraphStyle('URL',
    parent=styles['Normal'], fontName='Helvetica', fontSize=8.5,
    leading=13, textColor=colors.HexColor('#334155'), spaceAfter=3)

# ─── Helpers ──────────────────────────────────────────────────────────────────
def section_banner(text, color='#1E40AF'):
    """Blue (or custom) full-width banner for Part headings."""
    tbl = Table([[Paragraph(text, h1_style)]], colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(color)),
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('RIGHTPADDING',  (0,0), (-1,-1), 10),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return tbl

def sub_banner(text):
    """Light blue banner for sub-section (1.x) headings."""
    tbl = Table([[Paragraph(text, ParagraphStyle('SBH',
        parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10,
        leading=14, textColor=colors.HexColor('#1E3A8A')))
    ]], colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#DBEAFE')),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('RIGHTPADDING',  (0,0), (-1,-1), 10),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return tbl

def add_img(img_name, caption_text, max_width=CONTENT_W, max_height=14*cm):
    """Add image preserving real aspect ratio, capped at max_width / max_height."""
    path = os.path.join(IMG_DIR, img_name)
    if not os.path.exists(path):
        story.append(Paragraph(f"<i>[Missing Image: {img_name}]</i>", caption_style))
        return
    # Read real dimensions
    with PILImage.open(path) as pil:
        w_px, h_px = pil.size
    ratio = h_px / w_px
    # Fit within bounds
    w = max_width
    h = w * ratio
    if h > max_height:
        h = max_height
        w = h / ratio
    story.append(RLImage(path, width=w, height=h))
    story.append(Paragraph(caption_text, caption_style))

def url_table(rows):
    """Two-column table for URL listings: [Label, URL]."""
    data = [[Paragraph(f"<b>{r[0]}</b>", url_style),
             Paragraph(r[1], url_style)] for r in rows]
    tbl = Table(data, colWidths=[3.8*cm, CONTENT_W - 3.8*cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EFF6FF')),
        ('ROWBACKGROUNDS', (0,0), (-1,-1),
             [colors.HexColor('#F8FAFC'), colors.HexColor('#EFF6FF')]),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return tbl

# ─── Story ────────────────────────────────────────────────────────────────────
story = []

# Cover block
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Lab 1 Submission Report", title_style))
story.append(Paragraph("TokTickIT — Full-Stack Hello World Starter", subtitle_style))
story.append(Spacer(1, 0.3*cm))

# Info box
info_data = [
    ["Student Name", "Dechayut", "Student ID", "67070503414"],
    ["Peer Reviewer", "Vieng",   "Reviewer ID", "67070503404"],
    ["Course", "CPE 334 — Introduction to Software Engineering in the Age of AI Agents", "", ""],
    ["Repository", "https://github.com/NinjoMUDA/Dechayut_3414Lab1", "", ""],
]
info_tbl = Table(info_data, colWidths=[2.8*cm, 5.4*cm, 2.5*cm, 5.5*cm])
info_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#DBEAFE')),
    ('BACKGROUND', (2,0), (2,1),  colors.HexColor('#DBEAFE')),
    ('FONTNAME',  (0,0), (0,-1), 'Helvetica-Bold'),
    ('FONTNAME',  (2,0), (2,1),  'Helvetica-Bold'),
    ('FONTSIZE',  (0,0), (-1,-1), 8.5),
    ('LEADING',   (0,0), (-1,-1), 12),
    ('TOPPADDING',    (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING',   (0,0), (-1,-1), 7),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ('SPAN', (1,2), (3,2)),
    ('SPAN', (1,3), (3,3)),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(info_tbl)
story.append(Spacer(1, 0.5*cm))

# ═══════════════════════════════════════════════════════════════════
# PART 1
# ═══════════════════════════════════════════════════════════════════
story.append(section_banner("Part 1: Git Use with Engineering Workflow  (15 Points)"))
story.append(Spacer(1, 0.3*cm))

# 1.1 Links
story.append(sub_banner("1.1  Project Links & Identification"))
story.append(Spacer(1, 0.2*cm))
story.append(url_table([
    ["Repository",      "https://github.com/NinjoMUDA/Dechayut_3414Lab1"],
    ["Kanban Board",    "https://github.com/users/NinjoMUDA/projects/1"],
    ["Issue 1",         "https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/6"],
    ["Issue 2",         "https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/7"],
    ["Issue 3",         "https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/8"],
    ["Issue 4",         "https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/9"],
    ["PR #1 Foundation","https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/1"],
    ["PR #2 Health",    "https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/2"],
    ["PR #3 Seed",      "https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/3"],
    ["PR #4 Category",  "https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/4"],
    ["PR #5 Release",   "https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/5"],
]))
story.append(Spacer(1, 0.3*cm))

# 1.2 Kanban + Branches + IDE
story.append(sub_banner("1.2  Kanban Board, Branch Structure & IDE Directory"))
story.append(Paragraph(
    "A GitHub Project board (Kanban) was created and used throughout the lab to manage and track "
    "all four Issues sequentially. Each Issue represented a vertical slice of the application: "
    "<b>Issue 1</b> established the full-stack project foundation (Vite + React + Express + TypeScript), "
    "<b>Issue 2</b> implemented the <i>GET /api/health</i> endpoint, "
    "<b>Issue 3</b> defined the Prisma Category schema and seeded the database, and "
    "<b>Issue 4</b> connected the backend data layer to a live React UI with four distinct render states. "
    "Each Issue was completed on a dedicated feature branch, merged into <b>lab1-staging</b> via a reviewed Pull Request, "
    "and finally merged to <b>main</b> as the release branch. "
    "The Git branching strategy used was: "
    "<i>feature/* → lab1-staging → main</i>, with no direct commits to main at any point.",
    body_style))
add_img("สกรีนช็อต 2026-08-12 213215.png",
        "Figure 1.1: GitHub Project Kanban Board — all 4 Issues moved to Done column after each PR was approved and merged.")
add_img("สกรีนช็อต 2026-08-12 213252.png",
        "Figure 1.2: Active branch structure on GitHub — main (release), lab1-staging (integration), and four feature branches each corresponding to one Issue.")
add_img("git_graph.png",
        "Figure 1.3: GitHub Network Graph — visualizing feature branch branching, Pull Request merges into lab1-staging, and release merge to main.")
add_img("สกรีนช็อต 2026-08-12 213335.png",
        "Figure 1.4: IDE workspace directory tree — client/ (React+Vite frontend), server/ (Node+Express backend), docs/ (lab documentation), prisma/ (schema and migrations).")

# 1.3 Peer Review
story.append(sub_banner("1.3  Peer Review Evidence & Record"))
story.append(Paragraph(
    "Peer review was conducted between <b>Dechayut (@NinjoMUDA)</b> as the Author and "
    "<b>Vieng (@vienggg)</b> as the Peer Reviewer across all four Pull Requests. "
    "Both parties submitted formal English-language review comments on GitHub — not just approvals — "
    "with substantive technical observations covering code style, API contract correctness, "
    "Prisma schema design, and test coverage. "
    "The reviewer (<b>@vienggg</b>) clicked the official GitHub <b>Approve</b> button on each PR "
    "before merges were performed, satisfying the formal approval requirement outlined in the lab rules. "
    "All review conversations and verdicts were subsequently recorded in "
    "<i>docs/lab-01/reviewer.md</i> as part of the project documentation.",
    body_style))
add_img("สกรีนช็อต 2026-08-12 215058.png",
        "Figure 1.5: Author (@NinjoMUDA) posting structured English review comments and formal approval on partner (@vienggg) PRs #1–#4.")
add_img("สกรีนช็อต 2026-08-12 223531.png",
        "Figure 1.6: Partner (@vienggg) clicking Approve on PR #1 (feature/1-project-foundation) — confirms project foundation is correctly structured.")
add_img("สกรีนช็อต 2026-08-12 223546.png",
        "Figure 1.7: Partner (@vienggg) clicking Approve on PR #2 (feature/2-health-check) — confirms GET /api/health returns correct JSON shape.")
add_img("สกรีนช็อต 2026-08-12 223554.png",
        "Figure 1.8: Partner (@vienggg) clicking Approve on PR #3 (feature/3-category-seed) — confirms Prisma schema and upsert seed logic are correct.")
add_img("สกรีนช็อต 2026-08-12 223606.png",
        "Figure 1.9: Partner (@vienggg) clicking Approve on PR #4 (feature/4-category-list) — confirms UI renders all four states and API returns categories in id order.")
add_img("สกรีนช็อต 2026-08-12 215653.png",
        "Figure 1.10: Rendered docs/lab-01/reviewer.md — records all review verdicts, reviewer identity, PR links, and the full English-language conversation between both parties.")

# 1.4 README + gitignore
story.append(sub_banner("1.4  Rendered README.md and .gitignore"))
story.append(Paragraph(
    "The <b>README.md</b> was written to serve as the primary entry point for anyone cloning the repository. "
    "It includes a project overview describing TokTickIT as a full-stack IT Service Desk application, "
    "the complete technology stack (React + TypeScript + Vite + Bootstrap for frontend; "
    "Node.js + Express + TypeScript + Prisma + PostgreSQL for backend), "
    "and step-by-step setup instructions for both client and server environments. "
    "The <b>.gitignore</b> was configured to exclude sensitive and generated files including "
    "<i>node_modules/</i>, <i>.env</i> (secret credentials), and compiled build artifacts, "
    "ensuring the repository stays clean and secrets are never committed. "
    "A separate <b>.env.example</b> file provides a safe template showing the required "
    "DATABASE_URL format without exposing real credentials.",
    body_style))
add_img("สกรีนช็อต 2026-08-12 214541.png",
        "Figure 1.11: Rendered README.md on GitHub — project title, overview, tech stack table, and client/server setup commands.")
add_img("สกรีนช็อต 2026-08-12 214612.png",
        "Figure 1.12: Project .gitignore — excludes node_modules/, .env files, dist/ build artifacts, and OS-generated files.")
add_img("สกรีนช็อต 2026-08-12 214625.png",
        "Figure 1.13: Server .env.example — safe credential template showing DATABASE_URL structure without exposing the actual root:root@localhost:15432 connection string.")

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# PART 2
# ═══════════════════════════════════════════════════════════════════
story.append(section_banner("Part 2: Automated Tests  (10 Points)", color='#065F46'))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "A total of <b>5 automated tests</b> were written and verified passing 100% on the "
    "<b>main</b> branch — <b>2 Supertest API integration tests</b> on the server side and "
    "<b>3 Vitest React component unit tests</b> on the client side. "
    "The server tests use <i>Supertest</i> to send real HTTP requests against the Express application "
    "and verify the response status code and JSON body shape without needing a running server process. "
    "The client tests use <i>Vitest</i> with <i>@testing-library/react</i> to render the <i>App</i> component "
    "in a simulated DOM environment, mocking the <i>checkSystem()</i> API call via <i>vi.mock()</i> "
    "to test each UI state in isolation: Success (System Online + categories list), "
    "Failure (System Offline + error message), and initial Idle state (button not yet clicked).",
    body_style))

story.append(sub_banner("2.1  Test Execution — Terminal Output"))
story.append(Paragraph(
    "The following terminal screenshots were captured on the <b>main</b> branch after running "
    "<i>npm test</i> in both the server and client directories to confirm all 5 automated tests pass cleanly with 100% green status in the final release state:",
    body_style))
add_img("server_test_passed.png",
        "Figure 2.1: Server automated API tests terminal output (Supertest) — 2/2 passed (health.test.ts & categories.test.ts).")
add_img("client_test_passed.png",
        "Figure 2.2: Client automated React component tests terminal output (Vitest) — 3/3 passed (App.test.tsx).")

story.append(sub_banner("2.2  Test Documentation — docs/lab-01/tests.md"))
story.append(Paragraph(
    "All five tests are documented in <i>docs/lab-01/tests.md</i> following the "
    "standard test plan format: each test has a unique ID (API-01, API-02, UI-01, UI-02, UI-03), "
    "a description of the expected behavior, the framework used, and recorded pass/fail outcome.",
    body_style))
add_img("สกรีนช็อต 2026-08-12 220122.png",
        "Figure 2.3: Rendered docs/lab-01/tests.md — full test plan table documenting all 5 tests with IDs, expected results, frameworks (Supertest/Vitest), and evidence of passing on main.")

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# PART 3
# ═══════════════════════════════════════════════════════════════════
story.append(section_banner("Part 3: AI Use and Reflection  (5 Points)", color='#7C3AED'))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "AI assistance (Gemini 3.6 Flash and Claude Sonnet 4.6 via the Antigravity Agentic IDE) was used "
    "extensively throughout this lab to accelerate boilerplate generation and problem-solving. "
    "However, the AI was treated as a <b>pair-programming assistant, not an autonomous executor</b> — "
    "every generated output was reviewed, validated against the lab requirements, and manually corrected "
    "where necessary before being committed. "
    "A total of <b>8 key prompts</b> were selected and documented from the full session, "
    "covering project scaffolding, API endpoint implementation, Prisma schema design, "
    "database seeding, React UI component development, test mocking strategy, "
    "peer review workflow, and release verification.",
    body_style))

story.append(sub_banner("3.1  AI Prompts & Usage — docs/lab-01/ai_use.md"))
add_img("สกรีนช็อต 2026-08-12 220218.png",
        "Figure 3.1: Rendered ai_use.md prompt table — 8 documented prompts with the tool used, the summarised prompt, and what manual action was taken with the AI output.")
add_img("สกรีนช็อต 2026-08-12 220308.png",
        "Figure 3.2: Rendered ai_use.md personal reflection — two critical corrections: (1) manually fixing DATABASE_URL port from 5432 to 15432 after inspecting Docker container mapping; (2) switching Vitest mock strategy from vi.spyOn to vi.mock() to resolve ESM module pre-bundling isolation failure.")

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# PART 4
# ═══════════════════════════════════════════════════════════════════
story.append(section_banner("Part 4: Application Demo  (10 Points)", color='#B45309'))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "The TokTickIT (ตอกติ๊กกิต) application is a full-stack IT Service Desk Hello World starter. "
    "The <b>frontend</b> is a React + TypeScript + Vite app served at <b>http://localhost:5173</b>, "
    "styled with Bootstrap 5. "
    "The <b>backend</b> is a Node.js + Express + TypeScript API server running at <b>http://localhost:3000</b>, "
    "connected to a <b>PostgreSQL</b> database through <b>Prisma ORM</b>. "
    "The database is hosted in a Docker container mapped to port <b>15432</b> and pre-seeded "
    "with four IT service request categories: Account & Access, Hardware, Software, and Network. "
    "The UI implements four distinct render states: <b>Idle</b> (initial load), "
    "<b>Loading</b> (spinner while fetching), <b>Success</b> (System Online + categories), "
    "and <b>Error</b> (System Offline + error message). "
    "The two screenshots below demonstrate the Idle state and the Success state.",
    body_style))

story.append(sub_banner("4.1  Initial State (before clicking Check System)"))
story.append(Paragraph(
    "On first page load, the application renders in the <b>Idle state</b>: "
    "no API call has been made yet, no status badge is displayed, "
    "and the user sees only the application title and the [Check System] button.",
    body_style))
add_img("สกรีนช็อต 2026-08-12 223236.png",
        "Figure 4.1: TokTickIT — Idle/Initial state. Application loaded at http://localhost:5173 before any API call is triggered. Only the title and [Check System] button are visible.")

story.append(sub_banner("4.2  Success State (System Online)"))
story.append(Paragraph(
    "After clicking [Check System], the frontend calls <i>GET /api/health</i> and "
    "<i>GET /api/categories</i> concurrently. On success, the UI transitions to the "
    "<b>Success state</b>: a green badge labelled <i>System Status: Online</i> appears, "
    "and the four seeded categories are rendered as Bootstrap cards below.",
    body_style))
add_img("สกรีนช็อต 2026-08-12 220348.png",
        "Figure 4.2: TokTickIT — Success state. System Status: Online (green badge) confirmed. Four IT service categories (Account & Access, Hardware, Software, Network) fetched from PostgreSQL and displayed.")

# Footer rule
story.append(Spacer(1, 0.5*cm))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1')))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    "<b>End of Submission — CPE 334 Lab 1  |  Dechayut 67070503414</b>",
    ParagraphStyle('End', parent=styles['Normal'], fontName='Helvetica',
                   fontSize=8, textColor=colors.HexColor('#94A3B8'), alignment=1)))

# ─── Build ────────────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
print(f"PDF saved -> {PDF_OUT}")
