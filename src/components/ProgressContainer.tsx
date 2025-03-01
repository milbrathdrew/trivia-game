import { Box, Progress } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

interface ProgressContainerProps {
  progress: number;
  totalQuestions: number;
  animate: boolean;
}

export default function ProgressContainer({ progress, totalQuestions, animate }: ProgressContainerProps) {
  const prevProgressRef = useRef(progress);
  const [isDecreasing, setIsDecreasing] = useState(false);

  useEffect(() => {
    if (progress < prevProgressRef.current) {
      setIsDecreasing(true);
    } else if (progress > prevProgressRef.current) {
      setIsDecreasing(false);
    }
    prevProgressRef.current = progress;
  }, [progress]);

  return (
    <Box w="full" borderRadius="full" overflow="hidden">
      <Progress
        value={(progress / totalQuestions) * 100}
        size="lg"
        borderRadius="full"
        bg="#1D3B45"
        sx={{
          '& > div': {
            transition: animate ? 'all 0.3s ease-in-out' : 'none',
          },
          '[role="progressbar"] > div': {
            bg: isDecreasing ? '#1D3B45' : '#0AA574',
          }
        }}
      />
    </Box>
  );
} 