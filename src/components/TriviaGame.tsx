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

  if (gameState.isLoading) {
    return (
      <Container centerContent>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading question{retryAttempt > 0 ? ` (Attempt ${retryAttempt}/${MAX_RETRIES})` : ''}...</Text>
        </VStack>
      </Container>
    );
  }

  if (gameState.error) {
    return (
      <Container centerContent>
        <VStack spacing={6}>
          <Text color="red.500" fontSize="lg">
            {gameState.error}
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => {
              resetRetries();
              loadNewQuestion();
            }}
          >
            Try Again
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {devMode && (
        <Badge
          colorScheme="purple"
          position="fixed"
          top={4}
          right={4}
          px={2}
          py={1}
          borderRadius="md"
        >
          Dev Mode
        </Badge>
      )}
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <Stack spacing="6" flex="1">
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing="4">
            <Box p={4} bg="white" borderRadius="lg" boxShadow="sm">
              <Text fontWeight="bold">Score</Text>
              <Text fontSize="2xl">{gameState.stats.score}</Text>
            </Box>
            <Box p={4} bg="white" borderRadius="lg" boxShadow="sm">
              <Text fontWeight="bold">Streak</Text>
              <Text fontSize="2xl">{gameState.stats.streak}</Text>
            </Box>
            <Box p={4} bg="white" borderRadius="lg" boxShadow="sm">
              <Text fontWeight="bold">Accuracy</Text>
              <Text fontSize="2xl">
                {gameState.stats.totalQuestions > 0
                  ? Math.round((gameState.stats.correctAnswers / gameState.stats.totalQuestions) * 100)
                  : 0}%
              </Text>
              <Text fontSize="sm">
                {gameState.stats.correctAnswers}/{gameState.stats.totalQuestions}
              </Text>
            </Box>
          </SimpleGrid>

          {gameState.currentQuestion && (
            <Box>
              <Heading size="md" mb={4}>
                {gameState.currentQuestion.question}
              </Heading>
              <Stack spacing="4">
                {shuffleAnswers(gameState.currentQuestion).map((answer) => {
                  const isCorrectAnswer = answer === gameState.currentQuestion?.correctAnswer;
                  const isSelected = answer === selectedAnswer;
                  const showCorrectHighlight = isAnswerLocked && (devMode || isCorrectAnswer);
                  
                  // Calculate potential progress changes
                  const difficulty = gameState.currentQuestion?.difficulty ?? 'medium';
                  const progressChange = isCorrectAnswer ? 
                    '+1.0' : // Correct answers always give 1 point
                    `-${difficulty === 'easy' ? '0.1' :
                       difficulty === 'medium' ? '0.25' : '0.4'}`; // Loss based on difficulty
                  
                  return (
                    <Button
                      key={answer}
                      onClick={() => handleAnswer(answer)}
                      size="lg"
                      variant="outline"
                      whiteSpace="normal"
                      height="auto"
                      py={4}
                      isDisabled={isAnswerLocked}
                      bg={isAnswerLocked && isSelected ? (isCorrectAnswer ? 'green.50' : 'red.50') : undefined}
                      borderColor={showCorrectHighlight ? 'green.500' : 
                                 isAnswerLocked && isSelected ? 'red.500' : undefined}
                      _hover={{
                        borderColor: showCorrectHighlight ? 'green.600' : undefined,
                        bg: showCorrectHighlight ? 'green.50' : undefined,
                      }}
                      position="relative"
                    >
                      <Flex justify="space-between" align="center" width="100%">
                        <Text>{answer}</Text>
                        <Flex align="center" gap={2}>
                          {devMode && !isAnswerLocked && (
                            <Badge 
                              colorScheme={isCorrectAnswer ? 'green' : 'red'}
                              variant="subtle"
                            >
                              {progressChange}
                            </Badge>
                          )}
                          {showCorrectHighlight && (
                            <Badge colorScheme="green">
                              Correct
                            </Badge>
                          )}
                        </Flex>
                      </Flex>
                    </Button>
                  );
                })}
                {isAnswerLocked && !showCompletionModal && (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={loadNewQuestion}
                    mt={4}
                    isLoading={gameState.isLoading}
                  >
                    Next Question
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </Stack>

        <Flex
          direction={{ base: 'row', md: 'column' }}
          align="center"
          justify="center"
          minW={{ base: 'full', md: '120px' }}
          h={{ base: '60px', md: 'auto' }}
        >
          {gameState.currentQuestion && (
            <Box w="full" h="full">
              <ProgressContainer
                isCorrect={lastAnswer}
                difficulty={gameState.currentQuestion.difficulty}
                animate={shouldAnimate}
                progress={progress}
              />
            </Box>
          )}
        </Flex>
      </Flex>

      <Modal isOpen={showCompletionModal} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Congratulations! 🎉</ModalHeader>
          <ModalBody>
            <Text>You've completed the game with a score of {gameState.stats.score}!</Text>
            <Text mt={2}>
              Final Accuracy: {Math.round((gameState.stats.correctAnswers / gameState.stats.totalQuestions) * 100)}%
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={resetGame}>
              Play Again
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 