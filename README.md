# Trivia Game

A modern, interactive trivia game built with React, TypeScript, and Chakra UI. Test your knowledge across various categories while tracking your progress, score, and streaks.

## Features

- Dynamic question loading from OpenTrivia DB
- Progress tracking with visual feedback
- Score and streak system
- Developer mode for debugging (Cmd/Ctrl + D)
- Responsive design
- Error handling with automatic retries
- Beautiful UI with Chakra UI components

## Tech Stack

- React 18
- TypeScript
- Vite
- Chakra UI
- OpenTrivia DB API

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trivia-game.git
   cd trivia-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

## Deployment

This project is configured for easy deployment on Vercel. Simply:

1. Push to GitHub
2. Import the repository in Vercel
3. Deploy

## Development

### Developer Mode

Press `Cmd/Ctrl + D` to toggle developer mode, which shows:
- Progress changes for correct/incorrect answers
- Additional debugging information

### Environment Variables

No environment variables are required as the app uses public APIs.

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
