interface SuggestedQuestionsProps {
  questions: string[]
  onSelect: (q: string) => void
}

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="vo-suggestions">
      {questions.map((q, i) => (
        <button key={i} className="vo-suggestion" type="button" onClick={() => onSelect(q)}>
          {q}
        </button>
      ))}
    </div>
  )
}
