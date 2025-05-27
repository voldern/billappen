"""Unit tests for data models."""

import pytest

from forerkortet_tools.question_generator.models import (
    Answer,
    ChapterContent,
    Question,
    QuestionBank,
)
from forerkortet_tools.road_signs.models import RoadSign, ScrapingSession, SignCategory


class TestQuestionModels:
    """Test question-related models."""
    
    def test_answer_creation(self):
        """Test Answer model creation."""
        answer = Answer(text="Test answer", is_correct=True)
        assert answer.text == "Test answer"
        assert answer.is_correct is True
    
    def test_question_creation(self):
        """Test Question model creation."""
        answers = [
            Answer(text="Correct", is_correct=True),
            Answer(text="Wrong 1", is_correct=False),
            Answer(text="Wrong 2", is_correct=False),
        ]
        
        question = Question(
            id="q1",
            question="Test question?",
            answers=answers,
            category="Test",
            difficulty="medium",
            explanation="Test explanation"
        )
        
        assert question.id == "q1"
        assert question.question == "Test question?"
        assert len(question.answers) == 3
        assert question.get_correct_answer().text == "Correct"
        assert len(question.get_incorrect_answers()) == 2
    
    def test_question_to_app_format(self):
        """Test conversion to app format."""
        answers = [
            Answer(text="Correct", is_correct=True),
            Answer(text="Wrong", is_correct=False),
        ]
        
        question = Question(
            id="q1",
            question="Test?",
            answers=answers,
            category="Test"
        )
        
        app_format = question.to_app_format()
        
        assert app_format["id"] == "q1"
        assert app_format["question"] == "Test?"
        assert len(app_format["options"]) == 2
        assert app_format["correctAnswer"] in [0, 1]
        assert app_format["category"] == "Test"
    
    def test_question_bank(self):
        """Test QuestionBank functionality."""
        bank = QuestionBank()
        
        q1 = Question(
            question="Q1",
            answers=[Answer(text="A", is_correct=True)],
            category="Cat1",
            chapter="Ch1"
        )
        q2 = Question(
            question="Q2",
            answers=[Answer(text="B", is_correct=True)],
            category="Cat2",
            chapter="Ch1"
        )
        
        bank.add_question(q1)
        bank.add_question(q2)
        
        assert len(bank.questions) == 2
        assert len(bank.get_questions_by_category("Cat1")) == 1
        assert len(bank.get_questions_by_chapter("Ch1")) == 2
    
    def test_chapter_content(self):
        """Test ChapterContent model."""
        chapter = ChapterContent(
            title="Test Chapter",
            chapter_number="1.1",
            content="Test content",
            metadata={"key": "value"},
            subsections=[{"title": "Sub1", "content": "Content1"}]
        )
        
        assert chapter.title == "Test Chapter"
        assert chapter.chapter_number == "1.1"
        assert len(chapter.subsections) == 1


class TestRoadSignModels:
    """Test road sign-related models."""
    
    def test_road_sign_creation(self):
        """Test RoadSign model creation."""
        sign = RoadSign(
            id="100",
            name="Farlig sving",
            category="Fareskilt",
            description="Varsler om farlig sving",
            image_url="https://example.com/sign.png"
        )
        
        assert sign.id == "100"
        assert sign.name == "Farlig sving"
        assert sign.category == "Fareskilt"
    
    def test_road_sign_filename_safe_name(self):
        """Test filename-safe name generation."""
        sign = RoadSign(
            id="100",
            name="Farlig sving til høyre/venstre",
            category="Fareskilt"
        )
        
        safe_name = sign.get_filename_safe_name()
        assert "/" not in safe_name
        assert "\\" not in safe_name
        assert ":" not in safe_name
    
    def test_sign_category(self):
        """Test SignCategory model."""
        category = SignCategory(
            name="Fareskilt",
            url="https://example.com/fareskilt",
            sign_count=50
        )
        
        assert category.name == "Fareskilt"
        assert category.sign_count == 50
    
    def test_scraping_session(self):
        """Test ScrapingSession functionality."""
        session = ScrapingSession()
        
        sign1 = RoadSign(id="100", name="Sign 1", category="Cat1")
        sign2 = RoadSign(id="200", name="Sign 2", category="Cat2")
        sign3 = RoadSign(id="300", name="Sign 3", category="Cat1")
        
        session.add_sign(sign1)
        session.add_sign(sign2)
        session.add_sign(sign3)
        
        assert len(session.signs) == 3
        assert len(session.get_signs_by_category("Cat1")) == 2
        assert len(session.get_categories()) == 2
        
        export_dict = session.to_export_dict()
        assert export_dict["metadata"]["total_signs"] == 3
        assert len(export_dict["signs"]) == 3