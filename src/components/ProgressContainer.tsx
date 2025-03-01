import { Box, keyframes, Text } from '@chakra-ui/react';

interface ProgressContainerProps {
  isCorrect: boolean | null;
  difficulty: string;
  animate: boolean;
  progress: number; // Current progress (0-12)
}

const fillAnimation = keyframes`
  from { height: var(--from-height); }
  to { height: var(--to-height); }
`;

const emptyAnimation = keyframes`
  from { height: 100%; }
  to { height: 0%; }
`;

const getDifficultyPenalty = (difficulty: string): number => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 0.1; // Lose 10% on wrong answer
    case 'medium':
      return 0.25; // Lose 25% on wrong answer
    case 'hard':
      return 0.4; // Lose 40% on wrong answer
    default:
      return 0.25;
  }
};

const MAX_QUESTIONS = 12;

export default function ProgressContainer({ isCorrect, difficulty, animate, progress }: ProgressContainerProps) {
  const difficultyColor = {
    easy: 'green.400',
    medium: 'orange.400',
    hard: 'red.400',
  }[difficulty.toLowerCase()] || 'purple.400';

  const currentProgress = Math.min(progress / MAX_QUESTIONS * 100, 100);
  const fromHeight = isCorrect === null ? currentProgress : 
    isCorrect ? currentProgress - (100 / MAX_QUESTIONS) : currentProgress;
  const toHeight = isCorrect ? currentProgress : 
    Math.max(0, currentProgress - (getDifficultyPenalty(difficulty) * 100));

  return (
    <Box position="relative">
      <Box
        position="relative"
        width={{ base: "100%", md: "120px" }}
        height={{ base: "20px", md: "300px" }}
        bg="gray.100"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="inner"
      >
        <Box
          position="absolute"
          bottom="0"
          left="0"
          width="100%"
          bg={difficultyColor}
          transition="height 0.5s ease-in-out"
          style={{
            '--from-height': `${fromHeight}%`,
            '--to-height': `${toHeight}%`,
          } as React.CSSProperties}
          animation={animate ? `${fillAnimation} 0.5s ease-in-out forwards` : undefined}
          height={`${fromHeight}%`}
        />
      </Box>
      <Text
        textAlign="center"
        mt={2}
        fontSize="sm"
        fontWeight="bold"
      >
        {Math.floor(progress)}/{MAX_QUESTIONS}
      </Text>
    </Box>
  );
} 