import axios from 'axios';
import { Question } from '../types/game';

const API_BASE_URL = 'https://opentdb.com/api.php';

const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const fetchQuestion = async (): Promise<Question> => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        amount: 1,
        category: 11, // Film category
        type: 'multiple',
      },
    });

    const result = response.data.results[0];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      question: decodeHtmlEntities(result.question),
      correctAnswer: decodeHtmlEntities(result.correct_answer),
      incorrectAnswers: result.incorrect_answers.map(decodeHtmlEntities),
      category: decodeHtmlEntities(result.category),
      difficulty: result.difficulty,
    };
  } catch (error) {
    throw new Error('Failed to fetch question');
  }
}; 