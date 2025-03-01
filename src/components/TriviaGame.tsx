import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Stack,
  Text,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Spinner,
  useToast,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Badge,
  VStack,
} from '@chakra-ui/react';
import { Question, GameState, GameStats } from '../types/game';
import { fetchQuestion } from '../services/triviaService';
import ProgressContainer from './ProgressContainer';

const initialStats: GameStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  streak: 0,
  score: 0,
};

const MAX_QUESTIONS = 12;
const ANSWER_DELAY = 1500;
const MAX_RETRIES = 3;
const MIN_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

export default function TriviaGame() {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    stats: initialStats,
    isLoading: true,
    error: null,
  });
  const [lastAnswer, setLastAnswer] = useState<boolean | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const retryCountRef = useRef(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const requestInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const toast = useToast();

  // Handle developer mode keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        setDevMode(prev => !prev);
        toast({
          title: `Developer Mode ${!devMode ? 'Enabled' : 'Disabled'}`,
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devMode, toast]);

  const resetRetries = useCallback(() => {
    retryCountRef.current = 0;
    setRetryAttempt(0);
  }, []);

  const handleError = useCallback(() => {
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      setRetryAttempt(retryCountRef.current);
      toast({
        title: 'Retrying...',
        description: `Attempt ${retryCountRef.current} of ${MAX_RETRIES}`,
        status: 'info',
        duration: MIN_RETRY_DELAY,
        isClosable: true,
      });
      return true;
    }
    return false;
  }, [toast]);

  // Calculate backoff delay based on retry attempt
  const getBackoffDelay = (attempt: number) => {
    return Math.min(MIN_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
  };

  // Cleanup function for pending requests and timeouts
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset all request-related state
  const resetRequestState = useCallback(() => {
    cleanup();
    requestInProgress.current = false;
    retryCountRef.current = 0;
    setRetryAttempt(0);
  }, [cleanup]);

  const loadNewQuestion = useCallback(async () => {
    if (requestInProgress.current) {
      return;
    }

    try {
      cleanup();
      requestInProgress.current = true;
      setGameState(prev => ({ ...prev, isLoading: true, error: null }));

      abortControllerRef.current = new AbortController();
      const question = await fetchQuestion();
      
      setGameState(prev => ({
        ...prev,
        currentQuestion: question,
        isLoading: false,
      }));
      setLastAnswer(null);
      setShouldAnimate(false);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
      resetRequestState();
    } catch (error: any) {
      // Handle rate limit specifically
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers.get('Retry-After') || '5', 10);
        const delay = retryAfter * 1000 || getBackoffDelay(retryCountRef.current);
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          setRetryAttempt(retryCountRef.current);
          
          toast({
            title: 'Rate limited',
            description: `Waiting ${Math.round(delay / 1000)}s before retrying...`,
            status: 'warning',
            duration: delay,
            isClosable: true,
          });

          timeoutRef.current = setTimeout(() => {
            requestInProgress.current = false;
            loadNewQuestion();
          }, delay);
          return;
        }
      }

      // Handle other errors with standard backoff
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setRetryAttempt(retryCountRef.current);
        const delay = getBackoffDelay(retryCountRef.current - 1);

        toast({
          title: 'Retrying...',
          description: `Attempt ${retryCountRef.current} of ${MAX_RETRIES}`,
          status: 'info',
          duration: delay,
          isClosable: true,
        });

        timeoutRef.current = setTimeout(() => {
          requestInProgress.current = false;
          loadNewQuestion();
        }, delay);
      } else {
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load question',
        }));
        toast({
          title: 'Error',
          description: 'Failed to load question. Please try again.',
          status: 'error',
          duration: null,
          isClosable: true,
        });
        resetRequestState();
      }
    }
  }, [toast, resetRequestState]);

  // Initial load
  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const resetGame = useCallback(() => {
    setGameState({
      currentQuestion: null,
      stats: initialStats,
      isLoading: true,
      error: null,
    });
    setLastAnswer(null);
    setShouldAnimate(false);
    setProgress(0);
    setShowCompletionModal(false);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    resetRetries();
    loadNewQuestion();
  }, [resetRetries, loadNewQuestion]);

  const handleAnswer = (answer: string) => {
    if (!gameState.currentQuestion || isAnswerLocked) return;

    setIsAnswerLocked(true);
    setSelectedAnswer(answer);

    const isCorrect = answer === gameState.currentQuestion.correctAnswer;
    const newStats = {
      ...gameState.stats,
      totalQuestions: gameState.stats.totalQuestions + 1,
      correctAnswers: gameState.stats.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: gameState.stats.incorrectAnswers + (isCorrect ? 0 : 1),
      streak: isCorrect ? gameState.stats.streak + 1 : 0,
      score: gameState.stats.score + (isCorrect ? 10 * (gameState.stats.streak + 1) : 0),
    };

    setLastAnswer(isCorrect);
    setShouldAnimate(true);

    // Update progress
    if (isCorrect) {
      const newProgress = progress + 1;
      setProgress(newProgress);
      if (newProgress >= MAX_QUESTIONS) {
        setShowCompletionModal(true);
        return;
      }
    } else {
      const penalty = gameState.currentQuestion.difficulty === 'easy' ? 0.1 :
                     gameState.currentQuestion.difficulty === 'medium' ? 0.25 : 0.4;
      setProgress(Math.max(0, progress - penalty));
    }

    setGameState(prev => ({
      ...prev,
      stats: newStats,
    }));

    toast({
      title: isCorrect ? 'Correct!' : 'Wrong!',
      description: isCorrect
        ? `+${10 * (gameState.stats.streak + 1)} points!`
        : `The correct answer was: ${gameState.currentQuestion.correctAnswer}`,
      status: isCorrect ? 'success' : 'error',
      duration: 2000,
      isClosable: true,
    });
  };

  const shuffleAnswers = (question: Question): string[] => {
    return [...question.incorrectAnswers, question.correctAnswer]
      .sort(() => Math.random() - 0.5);
  };

  return (
    <Container maxW="container.sm" centerContent>
      <VStack spacing={6} align="stretch" w="full">
        <Box bg="white" p={6} borderRadius="xl" boxShadow="lg">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Heading size="lg" color="brand.600">Trivia Challenge</Heading>
              {devMode && (
                <Badge colorScheme="green" p={2} borderRadius="md">
                  Dev Mode
                </Badge>
              )}
            </Flex>
            
            <ProgressContainer
              progress={progress}
              totalQuestions={MAX_QUESTIONS}
              animate={shouldAnimate}
            />

            <Stack spacing={4}>
              <Text fontSize="sm" color="green.700" textAlign="center" fontWeight="medium">
                Score: {gameState.stats.score} | Streak: {gameState.stats.streak}
              </Text>
              <Text fontSize="sm" color="green.700" textAlign="center" fontWeight="medium">
                Correct: {gameState.stats.correctAnswers} | Incorrect: {gameState.stats.incorrectAnswers}
              </Text>
            </Stack>
          </VStack>
        </Box>

        <Box bg="white" p={6} borderRadius="xl" boxShadow="lg" minH="300px">
          {gameState.isLoading ? (
            <Flex justify="center" align="center" h="200px">
              <VStack spacing={4}>
                <Spinner size="xl" color="brand.500" thickness="4px" />
                <Text color="green.600">
                  Loading question{retryAttempt > 0 ? ` (Attempt ${retryAttempt}/${MAX_RETRIES})` : '...'}
                </Text>
              </VStack>
            </Flex>
          ) : gameState.error ? (
            <VStack spacing={4} align="center" justify="center" h="200px">
              <Text color="red.500">{gameState.error}</Text>
              <Button onClick={() => { resetRetries(); loadNewQuestion(); }} colorScheme="green">
                Try Again
              </Button>
            </VStack>
          ) : gameState.currentQuestion ? (
            <VStack spacing={6} align="stretch">
              <Text fontSize="xl" fontWeight="medium" color="green.800" textAlign="center">
                {gameState.currentQuestion.question}
              </Text>
              <SimpleGrid columns={1} spacing={3}>
                {shuffleAnswers(gameState.currentQuestion).map((answer) => {
                  const isSelected = selectedAnswer === answer;
                  const isCorrect = answer === gameState.currentQuestion?.correctAnswer;
                  const showResult = isAnswerLocked;
                  
                  let buttonProps: { variant: string; bg: string; borderColor?: string } = {
                    variant: 'outline',
                    bg: 'white',
                  };

                  if (showResult) {
                    if (isCorrect) {
                      buttonProps.bg = 'green.50';
                      buttonProps.borderColor = 'green.500';
                    } else if (isSelected && !isCorrect) {
                      buttonProps.bg = 'red.50';
                      buttonProps.borderColor = 'red.500';
                    }
                  } else if (isSelected) {
                    buttonProps.bg = 'brand.50';
                  }

                  return (
                    <Button
                      key={answer}
                      onClick={() => handleAnswer(answer)}
                      isDisabled={isAnswerLocked}
                      size="lg"
                      h="auto"
                      py={4}
                      whiteSpace="normal"
                      textAlign="center"
                      {...buttonProps}
                    >
                      <Text>{answer}</Text>
                      {devMode && !isAnswerLocked && gameState.currentQuestion && (
                        <Badge
                          ml={2}
                          colorScheme={answer === gameState.currentQuestion.correctAnswer ? 'green' : 'red'}
                        >
                          {answer === gameState.currentQuestion.correctAnswer ? '+1.0' : 
                            gameState.currentQuestion.difficulty === 'easy' ? '-0.1' :
                            gameState.currentQuestion.difficulty === 'medium' ? '-0.25' : '-0.4'}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </SimpleGrid>
              {isAnswerLocked && !showCompletionModal && (
                <Button
                  colorScheme="green"
                  size="lg"
                  onClick={loadNewQuestion}
                  mt={4}
                  isLoading={gameState.isLoading}
                >
                  Next Question
                </Button>
              )}
            </VStack>
          ) : null}
        </Box>

        <Modal isOpen={showCompletionModal} onClose={() => {}} isCentered>
          <ModalOverlay />
          <ModalContent bg="white" p={6}>
            <ModalHeader color="brand.600" textAlign="center">Game Complete!</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text textAlign="center" color="green.700" fontWeight="medium">Final Score: {gameState.stats.score}</Text>
                <Text textAlign="center" color="green.700" fontWeight="medium">Correct Answers: {gameState.stats.correctAnswers}</Text>
                <Text textAlign="center" color="green.700" fontWeight="medium">Incorrect Answers: {gameState.stats.incorrectAnswers}</Text>
                <Text textAlign="center" color="green.700" fontWeight="medium">Longest Streak: {gameState.stats.streak}</Text>
              </VStack>
            </ModalBody>
            <ModalFooter justifyContent="center">
              <Button onClick={resetGame} colorScheme="green" size="lg">
                Play Again
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 