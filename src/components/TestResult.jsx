export default function TestResult({ questions, answers, onRestart, onBack }) {
  const totalQuestions = questions.length;
  const correctCount = questions.reduce((count, q, idx) => {
    return count + (answers[idx] === q.correctIndex ? 1 : 0);
  }, 0);
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { emoji: "🎉", text: "Xuất sắc!", color: "text-green-600" };
    if (percentage >= 75) return { emoji: "🌟", text: "Tốt lắm!", color: "text-green-500" };
    if (percentage >= 60) return { emoji: "👍", text: "Khá tốt!", color: "text-blue-500" };
    if (percentage >= 50) return { emoji: "📚", text: "Cần cố gắng thêm", color: "text-orange-500" };
    return { emoji: "💪", text: "Đừng bỏ cuộc!", color: "text-red-500" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{performance.emoji}</div>
        <h2 className={`text-3xl font-bold mb-2 ${performance.color}`}>
          {performance.text}
        </h2>
        <p className="text-slate-600 mb-4">
          Bạn đã hoàn thành bài kiểm tra
        </p>
        
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#4aa6e0]">{correctCount}</div>
            <div className="text-sm text-slate-500">Đúng</div>
          </div>
          <div className="text-slate-300">/</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-700">{totalQuestions}</div>
            <div className="text-sm text-slate-500">Tổng số</div>
          </div>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all ${
              percentage >= 75 ? "bg-green-500" : percentage >= 50 ? "bg-blue-500" : "bg-orange-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-2xl font-semibold text-slate-700">
          {percentage}%
        </p>
      </div>

      {/* Detailed Results */}
      <div className="border-t border-slate-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Chi tiết kết quả</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correctIndex;
            
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 ${
                  isCorrect
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                    Câu {idx + 1}
                  </span>
                  <div className="flex-1">
                    {q.type === "image" && (
                      <div className="text-sm text-slate-600 mb-1">
                        Hình ảnh: <span className="font-medium">{q.options[q.correctIndex]}</span>
                      </div>
                    )}
                    {q.type === "kanji-hiragana" && (
                      <div className="text-sm text-slate-600 mb-1">
                        Kanji: <span className="font-medium text-lg">{q.question}</span> →{" "}
                        <span className="font-medium">{q.options[q.correctIndex]}</span>
                      </div>
                    )}
                    {q.type === "hiragana-kanji" && (
                      <div className="text-sm text-slate-600 mb-1">
                        Hiragana: <span className="font-medium">{q.question}</span> →{" "}
                        <span className="font-medium text-lg">{q.options[q.correctIndex]}</span>
                      </div>
                    )}
                    {q.type === "word-meaning" && (
                      <div className="text-sm text-slate-600 mb-1">
                        Từ: <span className="font-medium">{q.question}</span> →{" "}
                        <span className="font-medium">{q.options[q.correctIndex]}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      {isCorrect ? (
                        <span className="text-green-600">✓ Bạn đã trả lời đúng</span>
                      ) : (
                        <>
                          <span className="text-red-600">✗ Sai: </span>
                          <span>{q.options[userAnswer]}</span>
                          <span className="text-green-600"> | Đúng: </span>
                          <span>{q.options[q.correctIndex]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 font-semibold transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={onRestart}
          className="flex-1 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-3 font-semibold transition-colors"
        >
          Làm lại
        </button>
      </div>
    </div>
  );
}

