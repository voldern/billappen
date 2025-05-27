"""Data models for question generation."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class Answer(BaseModel):
    """Individual answer option."""
    
    text: str = Field(..., description="The answer text")
    is_correct: bool = Field(..., description="Whether this is the correct answer")


class Question(BaseModel):
    """Generated quiz question."""
    
    id: Optional[str] = Field(None, description="Unique question ID")
    question: str = Field(..., description="The question text")
    answers: List[Answer] = Field(..., description="List of answer options")
    chapter: Optional[str] = Field(None, description="Source chapter")
    category: Optional[str] = Field(None, description="Question category")
    difficulty: Optional[str] = Field("medium", description="Question difficulty level")
    source_text: Optional[str] = Field(None, description="Original text this question was based on")
    explanation: Optional[str] = Field(None, description="Explanation of the correct answer")
    image_url: Optional[str] = Field(None, description="URL to related image (for road signs)")
    sign_id: Optional[str] = Field(None, description="Road sign ID if applicable")
    
    def get_correct_answer(self) -> Optional[Answer]:
        """Get the correct answer."""
        for answer in self.answers:
            if answer.is_correct:
                return answer
        return None
    
    def get_incorrect_answers(self) -> List[Answer]:
        """Get all incorrect answers."""
        return [answer for answer in self.answers if not answer.is_correct]
    
    def to_app_format(self) -> Dict:
        """Convert to the format expected by the React Native app."""
        correct_index = None
        options = []
        
        for i, answer in enumerate(self.answers):
            options.append(answer.text)
            if answer.is_correct:
                correct_index = i
        
        return {
            "id": self.id or "",
            "question": self.question,
            "options": options,
            "correctAnswer": correct_index,
            "explanation": self.explanation or "",
            "category": self.category or "",
            "difficulty": self.difficulty or "medium",
            "imageUrl": self.image_url,
            "signId": self.sign_id,
        }


class QuestionBank(BaseModel):
    """Collection of questions."""
    
    questions: List[Question] = Field(default_factory=list)
    metadata: Dict = Field(default_factory=dict)
    
    def add_question(self, question: Question) -> None:
        """Add a question to the bank."""
        self.questions.append(question)
    
    def get_questions_by_category(self, category: str) -> List[Question]:
        """Get questions filtered by category."""
        return [q for q in self.questions if q.category == category]
    
    def get_questions_by_chapter(self, chapter: str) -> List[Question]:
        """Get questions filtered by chapter."""
        return [q for q in self.questions if q.chapter == chapter]
    
    def to_app_format(self) -> List[Dict]:
        """Convert all questions to app format."""
        return [q.to_app_format() for q in self.questions]


class ChapterContent(BaseModel):
    """Parsed chapter content from markdown."""
    
    title: str = Field(..., description="Chapter title")
    chapter_number: str = Field(..., description="Chapter number/ID")
    content: str = Field(..., description="Main content text")
    metadata: Dict = Field(default_factory=dict)
    subsections: List[Dict] = Field(default_factory=list)