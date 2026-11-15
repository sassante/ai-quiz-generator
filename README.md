# Study Deck  

An AI-powered study assistant that helps students prepare for exams by turning their lecture notes and study topics into  quizzes.

Instead of spending hours creating practice questions manually, students can upload their study materials or enter a topic and let AI generate questions to test their understanding.

## Overview

Study Deck  makes studying more interactive and accessible. It uses Google's Gemini API to analyse study materials and generate relevant practice questions based on the content provided by students.

Whether you're revising from lecture notes or learning a new topic, the application provides a simple way to practise, test your knowledge and identify areas that need improvement.

## Features

- **AI Question Generation:** Generate practice questions from uploaded study materials or manually entered topics.
- **Document Upload:** Upload study notes in supported PDF, DOCX and TXT formats.
- **Multiple Question Types:** Generate multiple-choice, true/false and short-answer questions.
- **Difficulty Selection:** Choose between easy, medium, hard or mixed difficulty levels.
- **Custom Question Count:** Select how many questions you want to generate.
- **Interactive Quizzes:** Answer questions through an interactive quiz interface.
- **Instant Results:** Submit your answers and receive your quiz score.
- **Answer Explanations:** Review correct answers and explanations to understand the material better.

## Technology Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

**AI Integration**
- Google Gemini API
- Google Gen AI SDK (`@google/genai`)

**Backend**
- Next.js API Routes
- Server-side API integration

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- A Google AI Studio account
- A Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/sassante/ai-quiz-generator.git
```

Navigate into the project directory:

```bash
cd YOUR_PROJECT_NAME
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory of the project.

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

**Important:** Never expose your API key in frontend code or commit your `.env.local` file to GitHub.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

## How It Works

1. A student uploads lecture notes or enters a study topic.
2. The application processes the supplied material.
3. The backend sends the content and selected quiz preferences to the Gemini API.
4. Gemini analyses the material and generates questions.
5. The application displays the generated questions in an interactive quiz.
6. The student answers the questions and submits the quiz.
7. The application calculates the score and displays the correct answers and explanations.

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key used for AI-powered question generation. |

## Security

- API keys are stored in environment variables.
- AI requests are handled server-side.
- API credentials are not exposed to the client.
- Uploaded study materials should be validated before processing.

## Future Improvements

Potential features for future versions include:

- AI-generated revision summaries.
- Flashcard generation.
- Timed examination mode.
- Quiz history and performance tracking.
- Identification of weak topics.
- Student accounts and personalised learning dashboards.
- Saving and revisiting previously generated quizzes.

## Contributing

Contributions, suggestions and improvements are welcome.

If you have ideas that could make studying more interactive and effective, feel free to contribute.

## Author

**Sandra Boahemaa Asante**



