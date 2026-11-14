"use client"

import { useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { BookOpen, Check, ChevronDown, Clipboard, FileText, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const MAX_FILE_SIZE = 15 * 1024 * 1024
const MAX_TEXT_LENGTH = 60_000

async function extractText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (["txt", "md", "markdown"].includes(extension ?? "")) return file.text()
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
  throw new Error("Choose a PDF, DOCX, TXT, or Markdown file.")
}

type Result = { quiz: string; notes: string }
type Tab = "quiz" | "notes"

export default function QuizGenerator() {
  const [input, setInput] = useState("")
  const [numQuestions, setNumQuestions] = useState(10)
  const [result, setResult] = useState<Result | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("quiz")
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file?: File) => {
    if (!file) return
    setFileError("")
    setError("")
    if (file.size > MAX_FILE_SIZE) {
      setFileError("This file is larger than 15 MB. Choose a smaller file.")
      return
    }
    try {
      const text = (await extractText(file)).trim()
      if (!text) throw new Error("We couldn’t find selectable text in this file. Try a text-based PDF or paste your notes instead.")
      setInput(text.slice(0, MAX_TEXT_LENGTH))
      setFileName(file.name)
      setResult(null)
    } catch (caught) {
      setFileError(caught instanceof Error ? caught.message : "We couldn’t read that file. Try another one.")
    }
  }

  const generate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setError("")
    setResult(null)
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), numQuestions }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Couldn’t generate your study set. Please try again.")
      setResult({ quiz: data.quiz, notes: data.notes })
      setActiveTab("quiz")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyContent = async () => {
    if (!result) return
    await navigator.clipboard.writeText(activeTab === "quiz" ? result.quiz : result.notes)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0

  return (
    <main className="study-app">
      <header className="study-topbar">
        <a href="#top" className="study-brand" aria-label="Fieldnotes study desk home">
          <span className="study-brand-mark">F<span>.</span></span>
          <span className="study-brand-name">Fieldnotes <span>/ Study desk</span></span>
        </a>
        <div className="study-topbar-note"><BookOpen aria-hidden="true" /> Made for the work of learning</div>
      </header>

      <div className="study-page" id="top">
        <section className="study-intro" aria-labelledby="page-title">
          <p className="study-kicker">A QUIETER WAY TO STUDY <span>—</span> 01</p>
          <h1 className="study-title" id="page-title"><span>Make sense of</span><em>your notes.</em></h1>
          <p className="study-lead">Bring a reading, lecture notes, or a whole chapter. Get a clear set of takeaways and questions drawn from what you share.</p>
        </section>

        <section className="study-workspace" id="workspace" aria-label="Study set workspace">
          <section className="study-source" aria-labelledby="source-heading">
            <div className="study-section-heading">
              <div>
                <p className="study-section-index">01 <span>/ SOURCE</span></p>
                <h2 id="source-heading">Start with your material</h2>
              </div>
              <span className="study-required">Required</span>
            </div>

            <div className="study-upload-group">
              <input
                ref={inputRef}
                id="study-file"
                type="file"
                accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                className="sr-only"
                onChange={(event) => { void handleFile(event.target.files?.[0]); event.target.value = "" }}
                aria-describedby="file-help file-error"
              />
              <button
                type="button"
                className="study-dropzone"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]) }}
                aria-label="Choose or drop a PDF, Word, text, or Markdown file"
              >
                <span className="study-upload-icon"><Upload aria-hidden="true" /></span>
                <span className="study-drop-copy"><strong>Choose a file</strong> <span>or drop it here</span></span>
                <span id="file-help" className="study-file-types">PDF · DOCX · TXT · MD <span>—</span> 15 MB max</span>
              </button>
              {fileName && <div className="study-file-chip"><span><FileText aria-hidden="true" /><span className="study-file-name">{fileName}</span></span><button type="button" onClick={() => { setFileName(""); setInput("") }} aria-label="Remove uploaded file"><X aria-hidden="true" /></button></div>}
              {fileError && <p id="file-error" role="alert" className="study-error">{fileError}</p>}
            </div>

            <div className="study-or"><span /> or paste text <span /></div>

            <div className="study-notes-field">
              <Label htmlFor="study-notes" className="study-field-label">Your notes</Label>
              <Textarea
                id="study-notes"
                placeholder="Paste notes, a reading, or the topic you’re working through…"
                value={input}
                onChange={(event) => { setInput(event.target.value); if (fileName) setFileName("") }}
                rows={6}
                maxLength={MAX_TEXT_LENGTH}
                className="study-textarea"
              />
              <div className="study-count"><span>{input.length > 0 ? `${wordCount.toLocaleString()} words` : "Text is processed for this session only"}</span><span>{input.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}</span></div>
            </div>

            <div className="study-options">
              <div><Label htmlFor="question-count" className="study-field-label">Practice questions</Label><p>Choose a set length</p></div>
              <div className="study-select-wrap">
                <select id="question-count" value={numQuestions} onChange={(event) => setNumQuestions(Number(event.target.value))} aria-label="Number of practice questions">
                  {[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>
                <span>questions</span><ChevronDown aria-hidden="true" />
              </div>
            </div>

            <Button onClick={generate} disabled={!input.trim() || isLoading} className="study-submit">
              {isLoading ? <><Loader2 className="study-spinner" aria-hidden="true" /> Making your study set…</> : <>Make my study set <span aria-hidden="true">↗</span></>}
            </Button>
            {error && <p role="alert" className="study-error study-submit-error">{error}</p>}
            <p className="study-privacy">Your file stays in your browser. Extracted text is sent securely to GPT to create your study set.</p>
          </section>

          <section className="study-result" aria-labelledby="result-heading">
            <div className="study-section-heading">
              <div>
                <p className="study-section-index">02 <span>/ STUDY SET</span></p>
                <h2 id="result-heading">Take it from here</h2>
              </div>
              {result && <Button variant="outline" size="sm" onClick={() => void copyContent()} className="study-copy">{copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}{copied ? "Copied" : "Copy"}</Button>}
            </div>

            {result ? <>
              <div className="study-tabs" role="tablist" aria-label="Study set content">
                {(["quiz", "notes"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => { setActiveTab(tab); setCopied(false) }} className={activeTab === tab ? "study-tab is-active" : "study-tab"}>{tab === "quiz" ? "Practice quiz" : "Study notes"}</button>)}
              </div>
              <div role="tabpanel" className="study-markdown"><ReactMarkdown>{activeTab === "quiz" ? result.quiz : result.notes}</ReactMarkdown></div>
            </> : <div className="study-empty">
              <div className="study-empty-top"><span>NOTHING HERE YET</span><span>—</span></div>
              <p className="study-empty-title">A good place to begin.</p>
              <p className="study-empty-copy">Add your source material and your study set will take shape here. Everything is built from the text you provide.</p>
              <ol className="study-output-list"><li><span>01</span> Clear takeaways</li><li><span>02</span> Questions to practice</li><li><span>03</span> An answer key</li></ol>
            </div>}
          </section>
        </section>

        <footer className="study-footer"><span>FIELDNOTES <i>—</i> STUDY DESK</span><span>Read closely. Remember more.</span></footer>
      </div>
    </main>
  )
}
