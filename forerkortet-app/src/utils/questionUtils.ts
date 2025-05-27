import { Question } from '../types';

/**
 * Reduces question options to exactly 4: 1 correct answer + 3 random incorrect answers
 * Also updates the correctAnswer index to match the new position
 */
export function reduceQuestionOptions(question: Question): Question {
  const correctAnswerText = question.options[question.correctAnswer];
  const incorrectOptions = question.options.filter((_, index) => index !== question.correctAnswer);
  
  // Shuffle incorrect options and take only 3
  const shuffledIncorrect = [...incorrectOptions].sort(() => Math.random() - 0.5).slice(0, 3);
  
  // Create new options array with correct answer and 3 incorrect ones
  const newOptions = [correctAnswerText, ...shuffledIncorrect];
  
  // Shuffle all options to randomize position
  const shuffledOptions = [...newOptions].sort(() => Math.random() - 0.5);
  
  // Find the new index of the correct answer
  const newCorrectAnswerIndex = shuffledOptions.indexOf(correctAnswerText);
  
  return {
    ...question,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswerIndex,
  };
}

/**
 * Process an array of questions to reduce their options
 */
export function processQuestionsWithReducedOptions(questions: Question[]): Question[] {
  return questions.map(question => reduceQuestionOptions(question));
}