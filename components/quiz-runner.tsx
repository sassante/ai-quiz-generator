"use client"

import { useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizQuestion } from "@/lib/quiz"

type QuizRunnerProps = {
  questions: QuizQuestion[]
  onRestart: () => void
}

function normalizeAnswer(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
}

export function QuizRunner({ questions, onRestart }: QuizRunnerProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length
  const score = questions.reduce((total, question, index) => {
    const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])].map(normalizeAnswer)
    return total + (accepted.includes(normalizeAnswer(answers[index] ?? "")) ? 1 : 0)
  }, 0)

  return (
    <form className="quiz-runner" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
      <div className="quiz-runner-meta"><span>{submitted ? `${score} / ${questions.length} correct` : `${answeredCount} / ${questions.length} answered`}</span>{submitted && <span>{Math.round((score / questions.length) * 100)}%</span>}</div>

      {submitted && <div className="quiz-score" role="status" aria-live="polite">
        <div className="quiz-score-mark"><Check aria-hidden="true" /></div>
        <div><span>YOUR SCORE</span><strong>{score}<small> / {questions.length}</small></strong></div>
        <p>{score === questions.length ? "Perfect score." : score === 0 ? "Keep practicing." : "Nice work. Keep going."}</p>
      </div>}

      <ol className="quiz-question-list">
        {questions.map((question, index) => {
          const isCorrect = [question.correctAnswer, ...(question.acceptedAnswers ?? [])].some((answer) => normalizeAnswer(answer) === normalizeAnswer(answers[index] ?? ""))
          return <li key={`${question.prompt}-${index}`} className={`quiz-question${submitted ? isCorrect ? " is-correct" : " needs-review" : ""}`}>
            <div className="quiz-question-top"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><span>{question.type === "multiple-choice" ? "MULTIPLE CHOICE" : question.type === "true-false" ? "TRUE / FALSE" : "SHORT ANSWER"}</span></div>
            <h3>{question.prompt}</h3>

            {question.type === "short-answer" ? <div className="quiz-short-answer">
              <label htmlFor={`answer-${index}`} className="sr-only">Your answer to question {index + 1}</label>
              <input
                id={`answer-${index}`}
                type="text"
                value={answers[index] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [index]: event.target.value }))}
                placeholder="Type your answer…"
                disabled={submitted}
              />
            </div> : <fieldset className="quiz-answer-options" disabled={submitted}>
              <legend className="sr-only">Answers for question {index + 1}</legend>
              {question.options.map((option, optionIndex) => <label key={option} className={`quiz-answer-option${answers[index] === option ? " is-picked" : ""}${submitted && option === question.correctAnswer ? " is-answer" : ""}`}>
                <input
                  type="radio"
                  name={`answer-${index}`}
                  value={option}
                  checked={answers[index] === option}
                  onChange={() => setAnswers((current) => ({ ...current, [index]: option }))}
                />
                <span className="quiz-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option}</span>
                {submitted && option === question.correctAnswer && <Check className="quiz-answer-check" aria-label="Correct answer" />}
              </label>)}
            </fieldset>}

            {submitted && <div className="quiz-explanation">
              <strong>{isCorrect ? "Correct" : "Answer"}</strong>
              {!isCorrect && <span className="quiz-correct-answer">{question.correctAnswer}</span>}
              <p>{question.explanation}</p>
            </div>}
          </li>
        })}
      </ol>

      {submitted ? <Button type="button" variant="outline" onClick={onRestart} className="quiz-restart-button"><RotateCcw aria-hidden="true" /> New quiz</Button> : <Button type="submit" disabled={answeredCount !== questions.length} className="quiz-submit-button">Submit answers</Button>}
    </form>
  )
}
