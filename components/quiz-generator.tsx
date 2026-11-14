"use client"

import { useRef, useState } from "react"
import { BookOpen, Check, FileText, Loader2, Sparkles, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QuizRunner } from "@/components/quiz-runner"
import type { Difficulty, GeneratedQuiz, QuestionType, SourceType } from "@/lib/quiz"

const MAX_FILE_SIZE = 15 * 1024 * 1024
const MAX_NOTES_LENGTH = 60_000
const MAX_TOPIC_LENGTH = 2_000

async function extractText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension === "txt") return file.text()
  if (extension === "docx") {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1)
      const content = await page.getTextContent()
      return content.items.map((item) => "str" in item ? item.str : "").join(" ")
    }))
    return pages.join("\n\n")
  }
  throw new Error("Choose a PDF, DOCX, or TXT file.")
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: "multiple-choice", label: "Multiple choice" },
  { value: "true-false", label: "True / false" },
  { value: "short-answer", label: "Short answer" },
]

const difficulties: Difficulty[] = ["easy", "medium", "hard"]

export function QuizGenerator() {
  const [sourceType, setSourceType] = useState<SourceType>("topic")
  const [input, setInput] = useState("")
  const [questionType, setQuestionType] = useState<QuestionType>("multiple-choice")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [numQuestions, setNumQuestions] = useState(5)
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null)
  const [quizVersion, setQuizVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const clearQuiz = () => {
    setQuiz(null)
    setError("")
  }

  const changeSource = (next: SourceType) => {
    setSourceType(next)
    setInput("")
    setFileName("")
    setFileError("")
    clearQuiz()
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    setFileError("")
    setError("")
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File is over 15 MB.")
      return
    }
    try {
      const text = (await extractText(file)).trim()
      if (!text) throw new Error("No selectable text found. Try a text-based PDF or paste your notes.")
      setInput(text.slice(0, MAX_NOTES_LENGTH))
      setFileName(file.name)
      clearQuiz()
    } catch (caught) {
      setFileError(caught instanceof Error ? caught.message : "Could not read this file.")
    }
  }

  const generate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setError("")
    setQuiz(null)
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), sourceType, questionType, difficulty, numQuestions }),
      })
      const data: unknown = await response.json()
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "Could not create the quiz. Try again."
        throw new Error(message)
      }
      if (!data || typeof data !== "object" || !("questions" in data) || !Array.isArray(data.questions) || data.questions.length !== numQuestions) {
        throw new Error("Gemini returned an incomplete quiz. Try again.")
      }
      setQuiz({ questions: data.questions as GeneratedQuiz["questions"] })
      setQuizVersion((version) => version + 1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the quiz. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0
  const maxLength = sourceType === "topic" ? MAX_TOPIC_LENGTH : MAX_NOTES_LENGTH

  return (
    <main className="quiz-app">
      <header className="quiz-header">
        <a href="#top" className="quiz-brand" aria-label="Studydeck home">
          <span className="quiz-brand-mark"><BookOpen aria-hidden="true" /></span>
          <span className="quiz-brand-name">Studydeck</span>
        </a>
        <span className="quiz-powered"><Sparkles aria-hidden="true" /> Gemini AI</span>
      </header>

      <div className="quiz-page" id="top">
        <section className="quiz-intro">
          <p className="quiz-eyebrow">STUDY, YOUR WAY</p>
          <h1>Make it <span>stick.</span></h1>
          <p>Turn notes or a topic into a quiz.</p>
        </section>

        <div className="quiz-layout">
          <form className="quiz-builder" onSubmit={(event) => { event.preventDefault(); void generate() }}>
            <div className="quiz-card-heading">
              <div>
                <span className="quiz-step">BUILD A QUIZ</span>
                <h2>Your material</h2>
              </div>
            </div>

            <fieldset className="quiz-fieldset quiz-source-fieldset">
              <legend className="quiz-label">Start with</legend>
              <div className="quiz-segments" role="radiogroup" aria-label="Source type">
                {(["topic", "notes"] as const).map((option) => (
                  <label key={option} className={`quiz-segment${sourceType === option ? " is-selected" : ""}`}>
                    <input type="radio" name="sourceType" value={option} checked={sourceType === option} onChange={() => changeSource(option)} />
                    {option === "topic" ? "A topic" : "My notes"}
                  </label>
                ))}
              </div>
            </fieldset>

            {sourceType === "notes" && <div className="quiz-upload-block">
              <input
                ref={inputRef}
                id="quiz-file"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(event) => { void handleFile(event.target.files?.[0]); event.target.value = "" }}
              />
              <button
                type="button"
                className="quiz-dropzone"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]) }}
                aria-label="Choose or drop PDF, DOCX, or TXT notes"
              >
                <span className="quiz-upload-icon"><Upload aria-hidden="true" /></span>
                <span><strong>Upload notes</strong><small id="quiz-file-help">PDF, DOCX, TXT · 15 MB max</small></span>
              </button>
              {fileName && <div className="quiz-file-chip"><span><FileText aria-hidden="true" /><span>{fileName}</span></span><button type="button" onClick={() => { setFileName(""); setInput(""); clearQuiz() }} aria-label="Remove uploaded file"><X aria-hidden="true" /></button></div>}
              {fileError && <p id="quiz-file-error" role="alert" className="quiz-error">{fileError}</p>}
            </div>}

            <div className="quiz-input-block">
              <Label htmlFor="quiz-source" className="quiz-label">{sourceType === "topic" ? "Topic" : "Paste notes"}</Label>
              <Textarea
                id="quiz-source"
                placeholder={sourceType === "topic" ? "e.g. Cell biology, the French Revolution…" : "Paste your lecture notes here…"}
                value={input}
                onChange={(event) => { setInput(event.target.value); setFileName(""); clearQuiz() }}
                rows={sourceType === "topic" ? 3 : 5}
                maxLength={maxLength}
                className="quiz-textarea"
                required
              />
              <div className="quiz-input-meta"><span>{sourceType === "notes" && input ? `${wordCount.toLocaleString()} words` : sourceType === "notes" ? "Text is sent to Gemini to make your quiz." : ""}</span><span>{input.length.toLocaleString()} / {maxLength.toLocaleString()}</span></div>
            </div>

            <fieldset className="quiz-fieldset">
              <legend className="quiz-label">Question type</legend>
              <div className="quiz-options quiz-options-type" role="radiogroup" aria-label="Question type">
                {questionTypes.map(({ value, label }) => (
                  <label key={value} className={`quiz-option${questionType === value ? " is-selected" : ""}`}>
                    <input type="radio" name="questionType" value={value} checked={questionType === value} onChange={() => setQuestionType(value)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="quiz-settings-row">
              <fieldset className="quiz-fieldset quiz-difficulty-fieldset">
                <legend className="quiz-label">Difficulty</legend>
                <div className="quiz-options" role="radiogroup" aria-label="Difficulty">
                  {difficulties.map((option) => (
                    <label key={option} className={`quiz-option${difficulty === option ? " is-selected" : ""}`}>
                      <input type="radio" name="difficulty" value={option} checked={difficulty === option} onChange={() => setDifficulty(option)} />
                      {option[0].toUpperCase() + option.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="quiz-count-field">
                <Label htmlFor="quiz-count" className="quiz-label">Questions</Label>
                <select id="quiz-count" value={numQuestions} onChange={(event) => setNumQuestions(Number(event.target.value))}>
                  {[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>
              </div>
            </div>

            <Button type="submit" disabled={!input.trim() || isLoading} className="quiz-generate-button">
              {isLoading ? <><Loader2 className="quiz-spinner" aria-hidden="true" /> Creating quiz…</> : <><Sparkles aria-hidden="true" /> Generate quiz</>}
            </Button>
            {error && <p role="alert" className="quiz-error quiz-request-error">{error}</p>}
          </form>

          <section className="quiz-result" aria-labelledby="quiz-result-title">
            {quiz ? <>
              <div className="quiz-result-header">
                <div>
                  <span className="quiz-step">YOUR QUIZ</span>
                  <h2 id="quiz-result-title">Ready when you are</h2>
                </div>
                <span className="quiz-count-badge">{quiz.questions.length} questions</span>
              </div>
              <QuizRunner key={quizVersion} questions={quiz.questions} onRestart={() => setQuiz(null)} />
            </> : <div className="quiz-empty">
              <span className="quiz-empty-icon"><BookOpen aria-hidden="true" /></span>
              <h2 id="quiz-result-title">Your quiz goes here.</h2>
              <p>Choose a topic or add notes to get started.</p>
              <div className="quiz-empty-hint"><Check aria-hidden="true" /><span>Answer, submit, and review.</span></div>
            </div>}
          </section>
        </div>

        <footer className="quiz-footer"><span>STUDYDECK</span><span>Made for learning.</span></footer>
      </div>
    </main>
  )
}
