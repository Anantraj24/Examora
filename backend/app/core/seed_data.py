import asyncio
import uuid
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash, create_exam_session_token
from app.models.models import (
    User, UserRole, QuestionBank, QuestionOption, Exam, ExamQuestion,
    ExamSession, StudentAnswer, ProctorEvent, ExamResult, SubjectiveEvaluation,
    QuestionType, DifficultyLevel, SessionStatus, IntegrityStatus
)

def gen_id():
    return str(uuid.uuid4())

async def seed_full_enterprise_dataset():
    async with AsyncSessionLocal() as db:
        # Check if users already exist
        check = await db.execute(select(User).where(User.email == "admin@examora.io"))
        if check.scalar_one_or_none():
            print("[INFO] Database already seeded with enterprise dataset.")
            return

        print("[INFO] Seeding Enterprise Users, Exams, Question Bank & Proctoring Logs...")
        now = datetime.now(timezone.utc)

        # 1. USERS: Admin, Examiners & Candidates
        admin = User(
            id=gen_id(),
            email="admin@examora.io",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Alan Vance",
            role=UserRole.ADMIN
        )
        examiner1 = User(
            id=gen_id(),
            email="examiner@examora.io",
            hashed_password=get_password_hash("examiner123"),
            full_name="Prof. Sarah Connor",
            role=UserRole.EXAMINER
        )
        examiner2 = User(
            id=gen_id(),
            email="marcus@examora.io",
            hashed_password=get_password_hash("examiner123"),
            full_name="Dr. Marcus Aurelius",
            role=UserRole.EXAMINER
        )

        candidates = [
            User(id=gen_id(), email="alex@examora.io", hashed_password=get_password_hash("student123"), full_name="Alex Mercer", role=UserRole.STUDENT),
            User(id=gen_id(), email="priya@examora.io", hashed_password=get_password_hash("student123"), full_name="Priya Sharma", role=UserRole.STUDENT),
            User(id=gen_id(), email="rohan@examora.io", hashed_password=get_password_hash("student123"), full_name="Rohan Mehta", role=UserRole.STUDENT),
            User(id=gen_id(), email="ananya@examora.io", hashed_password=get_password_hash("student123"), full_name="Ananya Joshi", role=UserRole.STUDENT),
            User(id=gen_id(), email="sahil@examora.io", hashed_password=get_password_hash("student123"), full_name="Sahil Kapoor", role=UserRole.STUDENT),
            User(id=gen_id(), email="divya@examora.io", hashed_password=get_password_hash("student123"), full_name="Divya Taneja", role=UserRole.STUDENT),
            User(id=gen_id(), email="vikram@examora.io", hashed_password=get_password_hash("student123"), full_name="Vikram Singh", role=UserRole.STUDENT),
            User(id=gen_id(), email="neha@examora.io", hashed_password=get_password_hash("student123"), full_name="Neha Reddy", role=UserRole.STUDENT),
            User(id=gen_id(), email="chen@examora.io", hashed_password=get_password_hash("student123"), full_name="Chen Wei", role=UserRole.STUDENT),
            User(id=gen_id(), email="elena@examora.io", hashed_password=get_password_hash("student123"), full_name="Elena Rostova", role=UserRole.STUDENT),
        ]

        db.add_all([admin, examiner1, examiner2] + candidates)
        await db.flush()

        # 2. QUESTION BANK: 15+ Rich Academic Questions
        questions = []
        options = []

        # Q1: MCQ OS
        q1 = QuestionBank(
            id=gen_id(), subject="Computer Science", topic="Operating Systems",
            question_type=QuestionType.MCQ, difficulty=DifficultyLevel.EASY,
            content="Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?",
            max_marks=2.0, negative_marks=0.5, created_by=examiner1.id
        )
        questions.append(q1)
        options.extend([
            QuestionOption(id=gen_id(), question_id=q1.id, option_text="Shortest Job First (SJF / SRTF)", is_correct=True, sort_order=0),
            QuestionOption(id=gen_id(), question_id=q1.id, option_text="First-Come First-Served (FCFS)", is_correct=False, sort_order=1),
            QuestionOption(id=gen_id(), question_id=q1.id, option_text="Round Robin (RR) with large quantum", is_correct=False, sort_order=2),
            QuestionOption(id=gen_id(), question_id=q1.id, option_text="Priority Scheduling without aging", is_correct=False, sort_order=3),
        ])

        # Q2: Multi-Select Networks
        q2 = QuestionBank(
            id=gen_id(), subject="Computer Science", topic="Computer Networks",
            question_type=QuestionType.MULTI_SELECT, difficulty=DifficultyLevel.MEDIUM,
            content="Which of the following protocols operate at the Transport Layer of the OSI / TCP-IP reference model? (Select all that apply)",
            max_marks=3.0, negative_marks=0.5, created_by=examiner1.id
        )
        questions.append(q2)
        options.extend([
            QuestionOption(id=gen_id(), question_id=q2.id, option_text="Transmission Control Protocol (TCP)", is_correct=True, sort_order=0),
            QuestionOption(id=gen_id(), question_id=q2.id, option_text="User Datagram Protocol (UDP)", is_correct=True, sort_order=1),
            QuestionOption(id=gen_id(), question_id=q2.id, option_text="Hypertext Transfer Protocol (HTTP)", is_correct=False, sort_order=2),
            QuestionOption(id=gen_id(), question_id=q2.id, option_text="Internet Control Message Protocol (ICMP)", is_correct=False, sort_order=3),
        ])

        # Q3: Short Answer OS Virtual Memory
        q3 = QuestionBank(
            id=gen_id(), subject="Computer Science", topic="Operating Systems",
            question_type=QuestionType.SHORT_ANSWER, difficulty=DifficultyLevel.MEDIUM,
            content="Explain the difference between Paging and Segmentation in modern virtual memory systems.",
            model_answer="Paging divides memory into fixed-size physical frames and logical pages, eliminating external fragmentation but potentially causing internal fragmentation. Segmentation divides memory into variable-sized logical segments reflecting program structure (code, stack, heap), which eliminates internal fragmentation but can cause external fragmentation.",
            rubric_criteria=[
                {"criterion": "Defines fixed vs variable chunk allocation", "points": 2.0},
                {"criterion": "Identifies internal vs external fragmentation tradeoffs", "points": 2.0},
                {"criterion": "Clarity & technical accuracy", "points": 1.0}
            ],
            max_marks=5.0, negative_marks=0.0, created_by=examiner1.id
        )
        questions.append(q3)

        # Q4: Long Answer Distributed Systems CAP
        q4 = QuestionBank(
            id=gen_id(), subject="Computer Science", topic="Distributed Systems & AI",
            question_type=QuestionType.LONG_ANSWER, difficulty=DifficultyLevel.HARD,
            content="Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models (e.g. Strong vs Eventual Consistency) using Quorum Consensus.",
            model_answer="The CAP theorem states that a distributed data store can guarantee at most two out of Consistency, Availability, and Partition Tolerance. Under network partitions (P), systems must trade off strict consistency (CP) vs high availability (AP). Modern systems achieve tunable consistency using Quorum consensus (R + W > N) where N is replica count, R is read quorum, and W is write quorum, allowing strong consistency or eventual consistency with vector clocks and conflict resolution.",
            rubric_criteria=[
                {"criterion": "Explains C, A, P definitions and impossibility proof", "points": 3.0},
                {"criterion": "Formulates Quorum math (R + W > N)", "points": 4.0},
                {"criterion": "Critiques latency tradeoffs & conflict resolution", "points": 3.0}
            ],
            max_marks=10.0, negative_marks=0.0, created_by=examiner1.id
        )
        questions.append(q4)

        # Q5: Image/Canvas B-Tree Diagram
        q5 = QuestionBank(
            id=gen_id(), subject="Computer Science", topic="Data Structures",
            question_type=QuestionType.IMAGE_UPLOAD, difficulty=DifficultyLevel.HARD,
            content="Draw and upload a handwritten or sketched diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3. Include node split points.",
            model_answer="B-tree of order 3 (max 2 keys per node). Splitting root when keys reach 3 items. Node splits result in balanced 2-level tree with root containing median keys.",
            rubric_criteria=[
                {"criterion": "Correct root split on 3rd key", "points": 2.5},
                {"criterion": "Accurate child pointer balancing", "points": 2.5}
            ],
            max_marks=5.0, negative_marks=0.0, created_by=examiner1.id
        )
        questions.append(q5)

        # Q6: MCQ AI/ML Loss
        q6 = QuestionBank(
            id=gen_id(), subject="AI & Machine Learning", topic="Deep Learning",
            question_type=QuestionType.MCQ, difficulty=DifficultyLevel.MEDIUM,
            content="Which loss function is optimal for multi-class classification where classes are mutually exclusive?",
            max_marks=2.0, negative_marks=0.5, created_by=examiner2.id
        )
        questions.append(q6)
        options.extend([
            QuestionOption(id=gen_id(), question_id=q6.id, option_text="Categorical Cross-Entropy with Softmax", is_correct=True, sort_order=0),
            QuestionOption(id=gen_id(), question_id=q6.id, option_text="Binary Cross-Entropy with Sigmoid", is_correct=False, sort_order=1),
            QuestionOption(id=gen_id(), question_id=q6.id, option_text="Mean Squared Error (MSE)", is_correct=False, sort_order=2),
            QuestionOption(id=gen_id(), question_id=q6.id, option_text="Hinge Loss", is_correct=False, sort_order=3),
        ])

        # Q7: Multi-Select Transformer Attention
        q7 = QuestionBank(
            id=gen_id(), subject="AI & Machine Learning", topic="NLP & Transformers",
            question_type=QuestionType.MULTI_SELECT, difficulty=DifficultyLevel.HARD,
            content="Which components are fundamental in a standard Scaled Dot-Product Self-Attention mechanism? (Select all that apply)",
            max_marks=3.0, negative_marks=0.5, created_by=examiner2.id
        )
        questions.append(q7)
        options.extend([
            QuestionOption(id=gen_id(), question_id=q7.id, option_text="Query, Key, and Value Projections (Q, K, V)", is_correct=True, sort_order=0),
            QuestionOption(id=gen_id(), question_id=q7.id, option_text="Division by sqrt(d_k) scaling factor", is_correct=True, sort_order=1),
            QuestionOption(id=gen_id(), question_id=q7.id, option_text="Softmax normalization along key dimension", is_correct=True, sort_order=2),
            QuestionOption(id=gen_id(), question_id=q7.id, option_text="Max-pooling subsampling layer", is_correct=False, sort_order=3),
        ])

        db.add_all(questions)
        await db.flush()
        db.add_all(options)
        await db.flush()

        # 3. EXAMS: 3 Main Examination Tracks
        exam1 = Exam(
            id=gen_id(),
            title="Advanced Computer Systems & AI Examination (2026)",
            subject="Computer Science",
            instructions="Strict AI proctoring active. Multiple face detection, continuous gaze tracking, and window blur logging are enforced.",
            duration_minutes=45,
            start_window=now - timedelta(hours=2),
            end_window=now + timedelta(days=14),
            blueprint_rules={"easy_count": 1, "medium_count": 2, "hard_count": 2},
            proctoring_config={"webcam_required": True, "gaze_tracking": True, "multi_face_detection": True, "max_tab_switches": 3},
            is_published=True,
            created_by=examiner1.id
        )
        exam2 = Exam(
            id=gen_id(),
            title="Deep Learning & Neural Network Architectures Final",
            subject="AI & Machine Learning",
            instructions="Comprehensive evaluation covering CNNs, Transformers, Optimization, and Loss Formulations.",
            duration_minutes=50,
            start_window=now - timedelta(hours=1),
            end_window=now + timedelta(days=10),
            blueprint_rules={"easy_count": 2, "medium_count": 3, "hard_count": 2},
            proctoring_config={"webcam_required": True, "gaze_tracking": True, "multi_face_detection": True, "max_tab_switches": 2},
            is_published=True,
            created_by=examiner2.id
        )
        exam3 = Exam(
            id=gen_id(),
            title="Distributed Systems & Cloud Architecture Benchmark",
            subject="Computer Science",
            instructions="Covers CAP Theorem, Raft consensus, vector clocks, and horizontal partitioning.",
            duration_minutes=60,
            start_window=now - timedelta(hours=4),
            end_window=now + timedelta(days=7),
            blueprint_rules={"easy_count": 1, "medium_count": 2, "hard_count": 2},
            proctoring_config={"webcam_required": True, "gaze_tracking": True, "multi_face_detection": True, "max_tab_switches": 3},
            is_published=True,
            created_by=examiner1.id
        )

        db.add_all([exam1, exam2, exam3])
        await db.flush()

        # Link questions to Exam 1
        for idx, q_obj in enumerate([q1, q2, q3, q4, q5]):
            db.add(ExamQuestion(id=gen_id(), exam_id=exam1.id, question_id=q_obj.id, order_index=idx))

        # 4. CANDIDATE SESSIONS & PROCTORING INCIDENTS
        # Candidate 1: Alex Mercer (Top Performer, Cleared)
        sess_alex = ExamSession(
            id=gen_id(), exam_id=exam1.id, student_id=candidates[0].id,
            session_token=create_exam_session_token(candidates[0].id, exam1.id, "alex_tok"),
            status=SessionStatus.SUBMITTED, started_at=now - timedelta(minutes=40),
            submitted_at=now - timedelta(minutes=5), server_deadline=now + timedelta(minutes=5),
            total_tab_switches=0, final_suspicion_score=8.5
        )
        # Candidate 2: Priya Sharma (High Suspicion, Flagged for Review)
        sess_priya = ExamSession(
            id=gen_id(), exam_id=exam1.id, student_id=candidates[1].id,
            session_token=create_exam_session_token(candidates[1].id, exam1.id, "priya_tok"),
            status=SessionStatus.IN_PROGRESS, started_at=now - timedelta(minutes=25),
            submitted_at=None, server_deadline=now + timedelta(minutes=20),
            total_tab_switches=3, final_suspicion_score=76.0
        )
        # Candidate 3: Rohan Mehta (High Suspicion, Multiple Faces)
        sess_rohan = ExamSession(
            id=gen_id(), exam_id=exam1.id, student_id=candidates[2].id,
            session_token=create_exam_session_token(candidates[2].id, exam1.id, "rohan_tok"),
            status=SessionStatus.FLAGGED, started_at=now - timedelta(minutes=35),
            submitted_at=now - timedelta(minutes=2), server_deadline=now + timedelta(minutes=10),
            total_tab_switches=4, final_suspicion_score=88.5
        )
        # Candidate 4: Ananya Joshi (Normal In Progress)
        sess_ananya = ExamSession(
            id=gen_id(), exam_id=exam1.id, student_id=candidates[3].id,
            session_token=create_exam_session_token(candidates[3].id, exam1.id, "ananya_tok"),
            status=SessionStatus.IN_PROGRESS, started_at=now - timedelta(minutes=15),
            submitted_at=None, server_deadline=now + timedelta(minutes=30),
            total_tab_switches=0, final_suspicion_score=14.0
        )
        # Candidate 5: Sahil Kapoor (Mid-Range Suspicion)
        sess_sahil = ExamSession(
            id=gen_id(), exam_id=exam1.id, student_id=candidates[4].id,
            session_token=create_exam_session_token(candidates[4].id, exam1.id, "sahil_tok"),
            status=SessionStatus.SUBMITTED, started_at=now - timedelta(minutes=50),
            submitted_at=now - timedelta(minutes=8), server_deadline=now - timedelta(minutes=5),
            total_tab_switches=2, final_suspicion_score=52.0
        )

        db.add_all([sess_alex, sess_priya, sess_rohan, sess_ananya, sess_sahil])
        await db.flush()

        # 5. PROCTORING INCIDENT LOGS
        p_events = [
            ProctorEvent(
                id=gen_id(), session_id=sess_priya.id, timestamp=now - timedelta(minutes=18),
                event_type="TAB_BLUR", suspicion_delta=15.0,
                raw_telemetry={"message": "Browser lost focus: Tab switched or minimized."}
            ),
            ProctorEvent(
                id=gen_id(), session_id=sess_priya.id, timestamp=now - timedelta(minutes=12),
                event_type="GAZE_AWAY", suspicion_delta=12.0,
                raw_telemetry={"message": "Continuous off-screen gaze deviation (RIGHT).", "gaze_direction": "RIGHT", "gaze_score": 0.48}
            ),
            ProctorEvent(
                id=gen_id(), session_id=sess_rohan.id, timestamp=now - timedelta(minutes=22),
                event_type="MULTI_FACE", suspicion_delta=25.0,
                raw_telemetry={"message": "Multiple persons detected in webcam frame (2 faces visible).", "face_count": 2}
            ),
            ProctorEvent(
                id=gen_id(), session_id=sess_rohan.id, timestamp=now - timedelta(minutes=10),
                event_type="FACE_ABSENT", suspicion_delta=12.0,
                raw_telemetry={"message": "Candidate face absent for >15 seconds."}
            ),
        ]
        db.add_all(p_events)

        # 6. ANSWERS & SUBJECTIVE EVALUATIONS FOR ALEX MERCER
        opt_q1_correct = [o.id for o in options if o.question_id == q1.id and o.is_correct][0]
        opts_q2_correct = [o.id for o in options if o.question_id == q2.id and o.is_correct]

        ans1 = StudentAnswer(
            id=gen_id(), session_id=sess_alex.id, question_id=q1.id,
            selected_option_ids=[opt_q1_correct], answered_at=now - timedelta(minutes=38)
        )
        ans2 = StudentAnswer(
            id=gen_id(), session_id=sess_alex.id, question_id=q2.id,
            selected_option_ids=opts_q2_correct, answered_at=now - timedelta(minutes=34)
        )
        ans3 = StudentAnswer(
            id=gen_id(), session_id=sess_alex.id, question_id=q3.id,
            text_response="Paging divides memory into fixed-size physical blocks called frames and logical pages. This completely prevents external fragmentation. In contrast, segmentation splits memory into variable-sized logical segments like code, stack, and heap. While it avoids internal fragmentation, it can cause external fragmentation over time.",
            word_count=52, answered_at=now - timedelta(minutes=26)
        )
        ans4 = StudentAnswer(
            id=gen_id(), session_id=sess_alex.id, question_id=q4.id,
            text_response="The CAP Theorem proves that a distributed system cannot simultaneously achieve Consistency, Availability, and Partition Tolerance under network splits. When partitions happen, systems must choose between CP (consistent, unavailable during partition) and AP (available, eventual consistency). Modern databases utilize Quorum Consensus governed by R + W > N. When the read quorum R plus write quorum W exceeds the total replica count N, the read set is mathematically guaranteed to overlap with at least one updated replica containing the latest write timestamp, ensuring linearizable consistency.",
            word_count=88, answered_at=now - timedelta(minutes=15)
        )
        ans5 = StudentAnswer(
            id=gen_id(), session_id=sess_alex.id, question_id=q5.id,
            text_response="[Diagram: Key insertions at order 3 median balance. Root split on insertion of 20 with child pointers 5,6 and 12,30].",
            ocr_extracted_text="B-Tree Order 3: Node Split at 10,20,5 -> Root [10], Left [5,6], Right [12,20,30]",
            word_count=20, answered_at=now - timedelta(minutes=8)
        )

        db.add_all([ans1, ans2, ans3, ans4, ans5])
        await db.flush()

        # Subjective AI Evaluations
        eval3 = SubjectiveEvaluation(
            id=gen_id(), answer_id=ans3.id,
            ai_suggested_score=4.8,
            ai_justification="Comprehensive technical explanation of paging fixed frames vs segmentation variable chunks. Correctly identifies fragmentation tradeoffs.",
            ai_rubric_breakdown={
                "key_concepts_matched": ["paging", "frames", "pages", "segmentation", "external fragmentation", "internal fragmentation"],
                "key_concepts_missed": [],
                "content_coverage_ratio": 0.96,
                "criteria_scores": {"Chunk allocation": "2.0/2.0", "Fragmentation tradeoffs": "2.0/2.0", "Clarity": "0.8/1.0"}
            },
            final_examiner_score=4.8,
            examiner_feedback="Excellent technical depth and clarity.",
            evaluated_by=examiner1.id, evaluated_at=now - timedelta(minutes=4)
        )
        eval4 = SubjectiveEvaluation(
            id=gen_id(), answer_id=ans4.id,
            ai_suggested_score=9.5,
            ai_justification="Rigorous explanation of CAP tradeoff, CP/AP models, and exact quorum formula (R + W > N) overlap proof.",
            ai_rubric_breakdown={
                "key_concepts_matched": ["cap theorem", "consistency", "availability", "partition tolerance", "quorum consensus", "r + w > n", "linearizability"],
                "key_concepts_missed": [],
                "content_coverage_ratio": 0.95,
                "criteria_scores": {"C, A, P definitions": "3.0/3.0", "Quorum math": "4.0/4.0", "Tradeoffs": "2.5/3.0"}
            },
            final_examiner_score=9.5,
            examiner_feedback="Flawless mathematical formulation of quorum consistency.",
            evaluated_by=examiner1.id, evaluated_at=now - timedelta(minutes=3)
        )
        eval5 = SubjectiveEvaluation(
            id=gen_id(), answer_id=ans5.id,
            ai_suggested_score=4.5,
            ai_justification="Correct B-tree node split points and balanced child pointers.",
            final_examiner_score=4.5,
            examiner_feedback="Clean diagrammatic representation.",
            evaluated_by=examiner1.id, evaluated_at=now - timedelta(minutes=2)
        )

        db.add_all([eval3, eval4, eval5])

        # 7. EXAM RESULTS & PERCENTILES
        # Alex's Score: 2.0 (Q1) + 3.0 (Q2) + 4.8 (Q3) + 9.5 (Q4) + 4.5 (Q5) = 23.8 / 25.0 (95.2%, 96th percentile)
        res_alex = ExamResult(
            id=gen_id(), session_id=sess_alex.id,
            objective_score=5.0, subjective_score=18.8, total_score=23.8,
            max_possible_score=25.0, percentile=96.4,
            integrity_status=IntegrityStatus.CLEARED,
            is_published=True, evaluated_at=now - timedelta(minutes=2)
        )
        # Sahil's Score: 18.0 / 25.0 (72%, 64th percentile)
        res_sahil = ExamResult(
            id=gen_id(), session_id=sess_sahil.id,
            objective_score=4.0, subjective_score=14.0, total_score=18.0,
            max_possible_score=25.0, percentile=64.0,
            integrity_status=IntegrityStatus.CLEARED,
            is_published=True, evaluated_at=now - timedelta(minutes=1)
        )
        # Rohan's Score: 14.5 / 25.0 (Review Required)
        res_rohan = ExamResult(
            id=gen_id(), session_id=sess_rohan.id,
            objective_score=3.5, subjective_score=11.0, total_score=14.5,
            max_possible_score=25.0, percentile=41.2,
            integrity_status=IntegrityStatus.REVIEW_REQUIRED,
            is_published=False, evaluated_at=now
        )

        db.add_all([res_alex, res_sahil, res_rohan])
        await db.commit()
        print("[INFO] Enterprise Dataset successfully seeded into PostgreSQL/SQLite!")
