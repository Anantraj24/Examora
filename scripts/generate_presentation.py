"""
AegisExam AI - Official Project Final Presentation Generator
Generates AegisExam_AI_Final_Presentation.pptx conforming to Week 8 project requirements.
"""
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_filename="AegisExam_AI_Final_Presentation.pptx"):
    prs = Presentation()
    # Set slide dimensions to widescreen (16:9)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    BG_COLOR = RGBColor(15, 23, 42)        # Slate 900
    CARD_BG = RGBColor(30, 41, 59)         # Slate 800
    ACCENT_CYAN = RGBColor(56, 189, 248)   # Sky 400
    ACCENT_PURPLE = RGBColor(168, 85, 247) # Purple 500
    TEXT_LIGHT = RGBColor(241, 245, 249)   # Slate 100
    TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
    BORDER_COLOR = RGBColor(51, 65, 85)    # Slate 700

    def apply_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, category: str, title: str):
        # Category pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.4))
        cat_tf = cat_box.text_frame
        cat_tf.word_wrap = True
        p_cat = cat_tf.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_CYAN

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.8))
        title_tf = title_box.text_frame
        title_tf.word_wrap = True
        p_title = title_tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_LIGHT

    def add_card(slide, left, top, width, height, title, items):
        # Card background
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1)

        # Card content
        tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.2), width - Inches(0.5), height - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_head = tf.paragraphs[0]
        p_head.text = title
        p_head.font.size = Pt(16)
        p_head.font.bold = True
        p_head.font.color.rgb = ACCENT_CYAN
        p_head.space_after = Pt(10)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_LIGHT
            p.space_after = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide1)

    t_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(3.8))
    t_tf = t_box.text_frame
    t_tf.word_wrap = True

    p0 = t_tf.paragraphs[0]
    p0.text = "AEGISEXAM AI (EXAMORA)"
    p0.font.size = Pt(40)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_CYAN
    p0.space_after = Pt(12)

    p1 = t_tf.add_paragraph()
    p1.text = "AI-Based Intelligent Examination Platform with Automated Proctoring\nand Candidate Performance Analysis"
    p1.font.size = Pt(22)
    p1.font.color.rgb = TEXT_LIGHT
    p1.space_after = Pt(24)

    p2 = t_tf.add_paragraph()
    p2.text = "Enterprise Project Defense & Comprehensive Architecture Specification | 2026"
    p2.font.size = Pt(13)
    p2.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 2: Problem Statement & Motivation
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide2)
    add_header(slide2, "1. Executive Summary", "The Challenge of Scalable, Trustworthy Online Testing")

    add_card(slide2, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0), "Academic Dishonesty Risks", [
        "Unauthorized materials, off-screen device usage, and tab switching.",
        "Impersonation and secondary participants in room.",
        "Screen peeking and coordinated question leaks across test cohorts.",
        "Client clock tampering to manipulate time limits."
    ])

    add_card(slide2, Inches(4.8), Inches(1.8), Inches(3.6), Inches(5.0), "Operational Inefficiencies", [
        "Manual proctoring does not scale to thousands of simultaneous exam-takers.",
        "Subjective long answers require weeks of manual marking.",
        "Examiner bias and fatigue cause grade inconsistencies across cohorts.",
        "Lack of granular telemetry makes post-exam honor audits impossible."
    ])

    add_card(slide2, Inches(8.8), Inches(1.8), Inches(3.6), Inches(5.0), "Infrastructure Constraints", [
        "Continuous raw video streaming consumes excessive network bandwidth.",
        "Heavy cloud GPU costs for real-time video stream processing.",
        "Severe privacy and GDPR concerns regarding cloud video storage.",
        "Intermittent network dropouts invalidate student submissions."
    ])

    # -------------------------------------------------------------
    # SLIDE 3: Proposed Solution & Core Innovation
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide3)
    add_header(slide3, "2. Core Value Proposition", "Zero-Trust Architecture Powered by Edge ML & AI")

    add_card(slide3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.4), "1. Privacy-First Edge Proctoring", [
        "MediaPipe Face & Gaze Detection executed entirely client-side.",
        "Raw webcam video never leaves candidate device.",
        "Lightweight 10-second numerical telemetry pulse sent over WebSocket."
    ])

    add_card(slide3, Inches(6.8), Inches(1.8), Inches(5.6), Inches(2.4), "2. Zero-Trust Monotonic Engine", [
        "Server strictly computes and enforces expiration epoch deadlines.",
        "Client device clocks are completely disregarded.",
        "APScheduler background daemon auto-submits timed-out sessions."
    ])

    add_card(slide3, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.4), "3. Deterministic Paper Randomization", [
        "Seeded permutations using sha256(exam_id + student_id).",
        "Unique question sequences and option orderings per candidate.",
        "100% reproducible ordering across reconnections and page refreshes."
    ])

    add_card(slide3, Inches(6.8), Inches(4.5), Inches(5.6), Inches(2.4), "4. Human-in-the-Loop AI Grading", [
        "LLM semantic evaluation with rubric criteria matching.",
        "OCR text extraction for student diagrams and handwritten work.",
        "Examiner grading studio with pre-filled AI grades and annotation canvas."
    ])

    # -------------------------------------------------------------
    # SLIDE 4: High-Level System Architecture
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide4)
    add_header(slide4, "3. System Architecture", "Three-Tier Distributed Component Model")

    add_card(slide4, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0), "Frontend Client (Edge)", [
        "React 18 + TypeScript + Vite architecture.",
        "Tailwind / Glassmorphic UI with high contrast.",
        "MediaPipe FaceMesh & BlazeFace edge ML models.",
        "Canvas diagram sketcher & webcam proctor HUD.",
        "Full anti-cheat event interceptors (copy, right-click, blur)."
    ])

    add_card(slide4, Inches(4.8), Inches(1.8), Inches(3.6), Inches(5.0), "Application Backend (FastAPI)", [
        "Asynchronous FastAPI with non-blocking I/O.",
        "JWT Authentication with strict RBAC.",
        "Monotonic exam lifecycle engine & state machine.",
        "WebSocket connection hub with observer broadcast.",
        "Automated objective grader with negative marking."
    ])

    add_card(slide4, Inches(8.8), Inches(1.8), Inches(3.6), Inches(5.0), "Data & AI Pipeline", [
        "SQLAlchemy 2.0 Async ORM with Alembic migrations.",
        "PostgreSQL 16 / SQLite async persistence.",
        "OpenAI GPT-4o / Gemini AI subjective grading engine.",
        "Tesseract OCR & PIL image thumbnail pipeline.",
        "Docker Compose orchestration with isolated networks."
    ])

    # -------------------------------------------------------------
    # SLIDE 5: Client-Edge AI Proctoring Engine
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide5)
    add_header(slide5, "4. AI Proctoring Engine", "Client-Edge Telemetry & Mathematical Suspicion Scoring")

    add_card(slide5, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Proctoring Telemetry Vector", [
        "Face Detection: Flags prolonged candidate absence (absence penalty: +12.0/tick).",
        "Multi-Person Detection: Flags secondary faces entering frame (multi-face penalty: +25.0/tick).",
        "Gaze Estimation: 468 iris landmarks detect off-screen divergence (gaze penalty: +8.0/tick).",
        "Browser Behavioral: Logs tab visibility changes & window blur events (tab penalty: +15.0/switch).",
        "Snapshot Transmission: Only triggered during detected infractions for examiner audit."
    ])

    add_card(slide5, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Suspicion Metric Formulation", [
        "Real-Time Suspicion Score: S in [0.0, 100.0]",
        "S(t+1) = min(100.0, max(0.0, S(t) + delta_events))",
        "Automated Status Transitions:",
        "  - S < 40.0: Normal / Nominal Integrity",
        "  - 40.0 <= S < 80.0: Warning / Proctor Escalation",
        "  - S >= 80.0: Session FLAGGED for post-exam disqualification",
        "Zero Video Bandwidth: Vector size < 2 KB per heartbeat pulse."
    ])

    # -------------------------------------------------------------
    # SLIDE 6: Deterministic Paper Randomization
    # -------------------------------------------------------------
    slide6 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide6)
    add_header(slide6, "5. Exam Engine", "Cryptographic Deterministic Randomization")

    add_card(slide6, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Seed Generation Mechanism", [
        "Seed = sha256(exam_id + ':' + student_id)[:8] as 32-bit uint.",
        "Deterministic Pseudorandom Number Generator (PRNG).",
        "Blueprint Rules Enforcement:",
        "  - Custom distribution per difficulty (e.g. 5 Easy, 5 Medium, 2 Hard).",
        "  - Shuffles pool according to seed, slicing exact quotas.",
        "Zero-State Storage: No need to store full question permutations in DB."
    ])

    add_card(slide6, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Anti-Collusion Properties", [
        "Screen-Peeking Immunity: Neighboring students never see identical question sequences.",
        "Option Shuffling: Option A for Candidate 1 is Option D for Candidate 2.",
        "Reconnection Idempotency: Student browser refreshes produce 100% identical ordering.",
        "Audit Trail: Examiners can reproduce candidate view on demand with seed."
    ])

    # -------------------------------------------------------------
    # SLIDE 7: Subjective Evaluation Studio & OCR
    # -------------------------------------------------------------
    slide7 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide7)
    add_header(slide7, "6. AI Evaluation Pipeline", "Hybrid Automated & LLM-Assisted Grading")

    add_card(slide7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "AI Evaluation Architecture", [
        "Objective Questions: Evaluated instantly on submission.",
        "Multi-select Partial Credit: (Correct_picked - Wrong_picked) / Total_correct.",
        "Negative Marking: Automatic deduction for wrong answers.",
        "Subjective Evaluation: LLM evaluates text against model answer & rubric.",
        "Provides suggested score, justification, and matched concepts."
    ])

    add_card(slide7, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Examiner Review Studio", [
        "Human-in-the-Loop Control: Examiners inspect AI pre-scores.",
        "One-Click Override: Examiners adjust scores or provide feedback.",
        "Diagram Annotation: Canvas tool to draw highlights and feedback on student sketches.",
        "Cohort Publication: Batch results publication with instant percentile recalculation."
    ])

    # -------------------------------------------------------------
    # SLIDE 8: Live Proctor Mission Control
    # -------------------------------------------------------------
    slide8 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide8)
    add_header(slide8, "7. Proctoring Interface", "Examiner Mission Control & Live Incident HUD")

    add_card(slide8, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Live 3x3 Candidate Matrix", [
        "Real-time candidate telemetry cards.",
        "Color-coded suspicion badges (Green, Amber, Red).",
        "Instant violation indicators: Face Absent, Multiple Faces, Tab Lost.",
        "WebSocket observer connection broadcasts live alerts to examiners."
    ])

    add_card(slide8, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Candidate Incident Drawer", [
        "Deep-dive audit logs per candidate session.",
        "Chronological violation timeline with exact millisecond timestamps.",
        "Webcam violation snapshots for evidence review.",
        "One-click action: Disqualify candidate or issue proctor warning."
    ])

    # -------------------------------------------------------------
    # SLIDE 9: Candidate Scorecards & Analytics
    # -------------------------------------------------------------
    slide9 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide9)
    add_header(slide9, "8. Performance Analytics", "Interactive Student Scorecards & Cohort Insights")

    add_card(slide9, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Student Scorecard Features", [
        "Objective vs. subjective mark breakdown.",
        "Question-by-question analysis with correct answer explanations.",
        "Examiner feedback notes and diagram annotations.",
        "Privacy Protection: Proctoring suspicion scores are strictly hidden from students."
    ])

    add_card(slide9, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Cohort Analytics Dashboard", [
        "Bell curve score distribution across score brackets (0-20, 21-40, etc.).",
        "Percentile Rank Calculation: (Scores < Candidate / N) * 100.",
        "Cohort Average, Highest, and Lowest score summaries.",
        "Actionable insights for instructors to identify curriculum gaps."
    ])

    # -------------------------------------------------------------
    # SLIDE 10: Performance Benchmarks & Stress Tests
    # -------------------------------------------------------------
    slide10 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide10)
    add_header(slide10, "9. System Verification", "Comprehensive Stress & Load Testing")

    add_card(slide10, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Automated Test Suite (10/10 Passing)", [
        "End-to-end full exam lifecycle integration test.",
        "Question validation constraints (MCQ 1-correct, positive marks).",
        "Exam configuration rules (duration > 0, blueprint rules).",
        "Deterministic paper generation & option shuffling.",
        "Proctoring suspicion clamping & gaze deflection detection."
    ])

    add_card(slide10, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Stress Test Benchmark Results", [
        "Target: 25+ simultaneous concurrent student sessions.",
        "Throughput: 8.4+ API transactions/sec on single core.",
        "Zero Bottleneck Exceptions: 100% submission completion.",
        "Alembic Database Migrations: Verified 10-table schema versioning.",
        "Frontend Production Bundle: 0 TypeScript / Vite compilation warnings."
    ])

    # -------------------------------------------------------------
    # SLIDE 11: Technology Stack & Deployment
    # -------------------------------------------------------------
    slide11 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide11)
    add_header(slide11, "10. Tech Stack & Infrastructure", "Modern Enterprise Full-Stack Appliance")

    add_card(slide11, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0), "Frontend Stack", [
        "React 18 & TypeScript 5.0+",
        "Vite Build Tooling",
        "Tailwind CSS / Glassmorphism",
        "MediaPipe FaceMesh & BlazeFace",
        "HTML5 Canvas API",
        "Native WebSockets client"
    ])

    add_card(slide11, Inches(4.8), Inches(1.8), Inches(3.6), Inches(5.0), "Backend Stack", [
        "FastAPI (Python 3.12+ / 3.14)",
        "SQLAlchemy 2.0 Async ORM",
        "Alembic Database Migrations",
        "APScheduler Background Daemon",
        "Pydantic v2 validation",
        "python-jose (JWT) & bcrypt"
    ])

    add_card(slide11, Inches(8.8), Inches(1.8), Inches(3.6), Inches(5.0), "Deployment & Ops", [
        "Docker & Docker Compose",
        "PostgreSQL 16 Alpine",
        "Nginx Reverse Proxy",
        "Locust Load Testing Suite",
        "Automated Pytest CI pipeline",
        "Zero external cloud runtime deps"
    ])

    # -------------------------------------------------------------
    # SLIDE 12: Roadmap & Conclusion
    # -------------------------------------------------------------
    slide12 = prs.slides.add_slide(prs.slide_layouts[6])
    apply_slide_background(slide12)
    add_header(slide12, "11. Conclusion & Future Scope", "Delivering the Next Generation of Online Examinations")

    add_card(slide12, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Key Project Achievements", [
        "Complete 8-week syllabus objectives 100% fulfilled.",
        "Privacy-preserving edge AI eliminates server video streaming overhead.",
        "Deterministic paper randomization eliminates cheating collusions.",
        "LLM subjective grading drastically cuts examiner grading turnaround.",
        "Production-ready with Docker, Alembic, and full test suites."
    ])

    add_card(slide12, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Future Development Scope", [
        "Acoustic Proctoring: WebAudio AI model for whisper & background noise detection.",
        "LMS Integration: 1-click Canvas / Moodle LTI 1.3 standard integration.",
        "Mobile Native Applications: React Native / Flutter apps with kiosk mode lock.",
        "Multimodal LLM Grading: Direct vision evaluation of complex mathematical proofs."
    ])

    prs.save(output_filename)
    print(f"[OK] Presentation successfully generated: {output_filename}")

if __name__ == "__main__":
    create_presentation()
