import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      'html, body': {
        bg: '#7CB573', // Main green background
        color: 'white',
        minHeight: '100vh',
      },
    },
  },
  colors: {
    brand: {
      50: '#F0F7EF',
      100: '#E1EFDF',
      200: '#C3DFBF',
      300: '#A5CF9F',
      400: '#87BF7F',
      500: '#7CB573', // Main green
      600: '#63915C',
      700: '#4A6D45',
      800: '#31482E',
      900: '#192417',
    },
    accent: {
      50: '#F0F7EF',
      100: '#E1EFDF',
      200: '#C3DFBF',
      300: '#A5CF9F',
      400: '#87BF7F',
      500: '#7CB573', // Main green
      600: '#63915C',
      700: '#4A6D45',
      800: '#31482E',
      900: '#192417',
    },
    trivia: {
      primary: '#7CB573',
      accent: '#63915C',
      sage: '#7CB573',
      teal: '#63915C',
      text: '#FFFFFF',
      correct: '#22C55E',    // Brighter green for correct answers
      correctBg: '#166534',  // Darker green background
      wrong: '#EF4444',      // Bright red for wrong answers
      wrongBg: '#991B1B',    // Darker red background
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: 'trivia.primary',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'scale(1.02)',
          },
          _active: {
            bg: 'brand.700',
          },
        },
        outline: {
          borderColor: 'trivia.primary',
          borderWidth: '2px',
          color: 'white',
          bg: 'transparent',
          _hover: {
            bg: 'whiteAlpha.100',
            transform: 'scale(1.02)',
          },
          _focus: {
            bg: 'whiteAlpha.100',
          },
          _active: {
            bg: 'whiteAlpha.200',
          },
          _disabled: {
            opacity: 0.6,
            bg: 'transparent',
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'accent.600',
          borderRadius: 'xl',
          boxShadow: 'lg',
          p: 6,
        },
      },
    },
    Progress: {
      baseStyle: {
        filledTrack: {
          bg: 'trivia.primary',
        },
        track: {
          bg: '#1D3B45',
        },
      },
    },
    Container: {
      baseStyle: {
        maxW: 'container.sm',
        px: { base: 4, md: 8 },
        py: { base: 6, md: 12 },
      },
    },
  },
  fonts: {
    heading: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme; 