import { ChakraProvider, Box } from '@chakra-ui/react';
import TriviaGame from './components/TriviaGame';

function App() {
  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50" py={4}>
        <TriviaGame />
      </Box>
    </ChakraProvider>
  );
}

export default App;
