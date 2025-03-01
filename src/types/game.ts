export interface Question {
  category: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}

export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  streak: number;
  score: number;
}

export interface GameState {
  currentQuestion: Question | null;
  stats: GameStats;
  isLoading: boolean;
  error: string | null;
  selectedCategory?: number;
} 