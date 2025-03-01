import { Question } from '../types/game';
import { Category } from '../types/categories';

const BASE_URL = 'https://opentdb.com/api.php';

interface TriviaResponse {
  response_code: number;
  results: Array<{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
}

export async function fetchQuestion(categoryId?: number): Promise<Question> {
  const params = new URLSearchParams({
    amount: '1',
    type: 'multiple'
  });

  if (categoryId) {
    params.append('category', categoryId.toString());
  }

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  
  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    }
    throw new Error('Failed to fetch question');
  }

  const data: TriviaResponse = await response.json();

  if (data.response_code !== 0) {
    throw new Error('Failed to fetch question');
  }

  const result = data.results[0];
  return {
    category: result.category,
    type: result.type,
    difficulty: result.difficulty as 'easy' | 'medium' | 'hard',
    question: decodeHTMLEntities(result.question),
    correctAnswer: decodeHTMLEntities(result.correct_answer),
    incorrectAnswers: result.incorrect_answers.map(decodeHTMLEntities)
  };
}

// Helper function to decode HTML entities
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('https://opentdb.com/api_category.php');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await response.json();
  return data.trivia_categories;
} 