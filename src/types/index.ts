export interface Question {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
}

export interface GameState {
  currentQuestion: Question | null;
  stats: GameStats;
  loading: boolean;
  error: string | null;
  selectedAnswer: string | null;
  isAnswerRevealed: boolean;
} 