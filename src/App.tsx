import { ChakraProvider, Box } from '@chakra-ui/react';
import TriviaGame from './components/TriviaGame';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="accent.500" py={8} px={4} borderRadius="3xl">
        <Box maxW="container.md" mx="auto">
          <TriviaGame />
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
