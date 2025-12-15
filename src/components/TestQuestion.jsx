export default function TestQuestion({
  question,
  selectedIndex,
  onSelect,
  showResult,
  correctIndex,
}) {
  const isAnswered = selectedIndex !== null && selectedIndex !== undefined;
  const isCorrect = isAnswered && selectedIndex === correctIndex;
  const showCorrect = showResult && isCorrect;
  const showIncorrect = showResult && isAnswered && selectedIndex !== correctIndex;

  const renderQuestion = () => {
    switch (question.type) {
      case "image":
        return (
          <div className="text-center">
            <img
              src={question.question}
              alt="Question"
              className="max-w-md mx-auto rounded-lg shadow-md mb-4"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
              }}
            />
            <p className="text-lg font-semibold text-slate-700">
              Chọn từ tiếng Nhật phù hợp với hình ảnh
            </p>
          </div>
        );

      case "kanji-hiragana":
        return (
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-800 mb-4">
              {question.question}
            </p>
            <p className="text-lg font-semibold text-slate-700">
              Chọn cách đọc Hiragana đúng
            </p>
          </div>
        );

      case "hiragana-kanji":
        return (
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800 mb-4">
              {question.question}
            </p>
            <p className="text-lg font-semibold text-slate-700">
              Chọn chữ Kanji đúng
            </p>
          </div>
        );

      case "word-meaning":
        return (
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800 mb-2">
              {question.question}
            </p>
            {question.questionFurigana && (
              <p className="text-xl text-slate-500 mb-4">
                {question.questionFurigana}
              </p>
            )}
            <p className="text-lg font-semibold text-slate-700">
              Chọn nghĩa đúng
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
      {/* Question */}
      <div className="mb-8">{renderQuestion()}</div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectOption = idx === correctIndex;
          const showAsCorrect = showResult && isCorrectOption;
          const showAsIncorrect = showResult && isSelected && !isCorrectOption;

          return (
            <button
              key={idx}
              onClick={() => !showResult && onSelect(idx)}
              disabled={showResult}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                showAsCorrect
                  ? "bg-green-100 border-green-400 text-green-900"
                  : showAsIncorrect
                  ? "bg-red-100 border-red-400 text-red-900"
                  : isSelected
                  ? "bg-[#4aa6e0] text-white border-[#4aa6e0]"
                  : "bg-white border-slate-200 hover:border-[#4aa6e0] hover:bg-slate-50"
              } ${showResult ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    isSelected && !showResult
                      ? "bg-white text-[#4aa6e0]"
                      : showAsCorrect || showAsIncorrect
                      ? "bg-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <div className="font-medium">{option}</div>
                {showAsCorrect && (
                  <span className="ml-auto text-green-600 font-semibold">✓ Đúng</span>
                )}
                {showAsIncorrect && (
                  <span className="ml-auto text-red-600 font-semibold">✗ Sai</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

