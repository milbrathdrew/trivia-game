export interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  category: string;
  difficulty: string;
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
} 