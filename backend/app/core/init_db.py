import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, UserRole, QuestionBank, QuestionOption, Exam, ExamQuestion,
    QuestionType, DifficultyLevel
)

async def init_db():
    # 1. Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # 2. Seed initial data
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        user_res = await db.execute(select(User).where(User.email == "admin@exam.io"))
        if user_res.scalar_one_or_none():
            return

        # Seed Users
        admin_user = User(
            email="admin@exam.io",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Alan Vance (Admin)",
            role=UserRole.ADMIN
        )
        examiner_user = User(
            email="examiner@exam.io",
            hashed_password=get_password_hash("examiner123"),
            full_name="Prof. Sarah Connor (Examiner)",
            role=UserRole.EXAMINER
        )
        student_user = User(
            email="student@exam.io",
            hashed_password=get_password_hash("student123"),
            full_name="Alex Mercer (Candidate)",
            role=UserRole.STUDENT
        )
        student_user2 = User(
            email="priya@exam.io",
            hashed_password=get_password_hash("student123"),
            full_name="Priya Sharma",
            role=UserRole.STUDENT
        )
        
        db.add_all([admin_user, examiner_user, student_user, student_user2])
        await db.flush()
        
        # Seed Questions
        q1 = QuestionBank(
            subject="Computer Science",
            topic="Operating Systems",
            question_type=QuestionType.MCQ,
            difficulty=DifficultyLevel.EASY,
            content="Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?",
            max_marks=2.0,
            negative_marks=0.5,
            created_by=examiner_user.id
        )
        db.add(q1)
        await db.flush()
        
        db.add_all([
            QuestionOption(question_id=q1.id, option_text="Shortest Job First (SJF / SRTF)", is_correct=True, sort_order=0),
            QuestionOption(question_id=q1.id, option_text="First-Come First-Served (FCFS)", is_correct=False, sort_order=1),
            QuestionOption(question_id=q1.id, option_text="Round Robin (RR) with large quantum", is_correct=False, sort_order=2),
            QuestionOption(question_id=q1.id, option_text="Priority Scheduling with aging", is_correct=False, sort_order=3),
        ])

        q2 = QuestionBank(
            subject="Computer Science",
            topic="Computer Networks",
            question_type=QuestionType.MULTI_SELECT,
            difficulty=DifficultyLevel.MEDIUM,
            content="Which of the following protocols operate at the Transport Layer of the OSI / TCP-IP reference model? (Select all that apply)",
            max_marks=3.0,
            negative_marks=0.5,
            created_by=examiner_user.id
        )
        db.add(q2)
        await db.flush()
        
        db.add_all([
            QuestionOption(question_id=q2.id, option_text="Transmission Control Protocol (TCP)", is_correct=True, sort_order=0),
            QuestionOption(question_id=q2.id, option_text="User Datagram Protocol (UDP)", is_correct=True, sort_order=1),
            QuestionOption(question_id=q2.id, option_text="Hypertext Transfer Protocol (HTTP)", is_correct=False, sort_order=2),
            QuestionOption(question_id=q2.id, option_text="Internet Control Message Protocol (ICMP)", is_correct=False, sort_order=3),
        ])

        q3 = QuestionBank(
            subject="Computer Science",
            topic="Operating Systems",
            question_type=QuestionType.SHORT_ANSWER,
            difficulty=DifficultyLevel.MEDIUM,
            content="Explain the difference between Paging and Segmentation in modern virtual memory systems.",
            model_answer="Paging divides memory into fixed-size physical frames and logical pages, eliminating external fragmentation but potentially causing internal fragmentation. Segmentation divides memory into variable-sized logical segments reflecting program structure (code, stack, heap), which eliminates internal fragmentation but can cause external fragmentation.",
            rubric_criteria=[
                {"criterion": "Defines fixed vs variable chunk allocation", "points": 2.0},
                {"criterion": "Identifies internal vs external fragmentation tradeoffs", "points": 2.0},
                {"criterion": "Clarity & technical accuracy", "points": 1.0}
            ],
            max_marks=5.0,
            negative_marks=0.0,
            created_by=examiner_user.id
        )
        db.add(q3)

        q4 = QuestionBank(
            subject="Computer Science",
            topic="Distributed Systems & AI",
            question_type=QuestionType.LONG_ANSWER,
            difficulty=DifficultyLevel.HARD,
            content="Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models (e.g. Strong vs Eventual Consistency) using Quorum Consensus.",
            model_answer="The CAP theorem states that a distributed data store can guarantee at most two out of Consistency, Availability, and Partition Tolerance. Under network partitions (P), systems must trade off strict consistency (CP) vs high availability (AP). Modern systems achieve tunable consistency using Quorum consensus (R + W > N) where N is replica count, R is read quorum, and W is write quorum, allowing strong consistency or eventual consistency with vector clocks and conflict resolution.",
            rubric_criteria=[
                {"criterion": "Explains C, A, P definitions and impossibility proof", "points": 3.0},
                {"criterion": "Formulates Quorum math (R + W > N)", "points": 4.0},
                {"criterion": "Critiques latency tradeoffs & conflict resolution", "points": 3.0}
            ],
            max_marks=10.0,
            negative_marks=0.0,
            created_by=examiner_user.id
        )
        db.add(q4)

        q5 = QuestionBank(
            subject="Computer Science",
            topic="Data Structures",
            question_type=QuestionType.IMAGE_UPLOAD,
            difficulty=DifficultyLevel.HARD,
            content="Draw and upload a handwritten diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3. Include node split points.",
            model_answer="B-tree of order 3 (max 2 keys per node). Splitting root when keys reach 3 items. Node splits result in balanced 2-level tree with root containing median keys.",
            rubric_criteria=[
                {"criterion": "Correct root split on 3rd key", "points": 2.5},
                {"criterion": "Accurate child pointer balancing", "points": 2.5}
            ],
            max_marks=5.0,
            negative_marks=0.0,
            created_by=examiner_user.id
        )
        db.add(q5)
        await db.flush()
        
        # Seed an Active Exam
        now = datetime.now(timezone.utc)
        sample_exam = Exam(
            title="Advanced Computer Systems & AI Examination (2026)",
            subject="Computer Science",
            instructions="This examination is proctored with real-time AI computer vision. Keep your webcam active and avoid tab switching or looking away from the display.",
            duration_minutes=45,
            start_window=now - timedelta(hours=1),
            end_window=now + timedelta(days=7),
            blueprint_rules={"easy_count": 2, "medium_count": 2, "hard_count": 1},
            proctoring_config={
                "webcam_required": True,
                "gaze_tracking": True,
                "multi_face_detection": True,
                "max_tab_switches": 3,
                "gaze_sensitivity": 0.35
            },
            is_published=True,
            created_by=examiner_user.id
        )
        db.add(sample_exam)
        await db.flush()
        
        # Associate questions to exam
        for idx, q_obj in enumerate([q1, q2, q3, q4, q5]):
            eq = ExamQuestion(exam_id=sample_exam.id, question_id=q_obj.id, order_index=idx)
            db.add(eq)
            
        await db.commit()
