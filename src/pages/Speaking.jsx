import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const demoPhrases = [
  {
    jp: "今日はいい天気ですね。",
    romaji: "Kyou wa ii tenki desu ne.",
    vi: "Hôm nay trời đẹp nhỉ.",
    topic: "Chào hỏi",
  },
  {
    jp: "すみません、もう一度お願いします。",
    romaji: "Sumimasen, mou ichido onegaishimasu.",
    vi: "Xin lỗi, làm ơn nhắc lại một lần nữa.",
    topic: "Giao tiếp",
  },
  {
    jp: "駅までの行き方を教えてください。",
    romaji: "Eki made no ikikata wo oshiete kudasai.",
    vi: "Làm ơn chỉ giúp đường đến ga.",
    topic: "Hỏi đường",
  },
];

const tips = [
  "Nói chậm, rõ từng âm, chú ý trường âm và âm ngắt.",
  "Nhấn trọng âm đúng vị trí (đặc biệt với từ nhiều âm tiết).",
  "Nghe mẫu trước, bắt chước nhịp điệu (pitch accent).",
  "Đừng ngại lặp lại nhiều lần để ổn định khẩu hình.",
];

const actionIcons = [
  { label: "Nghe mẫu", icon: "🔊" },
  { label: "Ghi âm", icon: "🎙️" },
  { label: "Lưu lại", icon: "🔖" },
];

const phonemeBreakdown = [
  {
    symbol: "/l/",
    status: "Almost Correct",
    statusColor: "text-orange-500",
    barColor: "from-orange-400 to-orange-500",
    tip: "Đặt đầu lưỡi chạm nhẹ nướu trên, giữ luồng hơi đều.",
  },
  {
    symbol: "/ɪ/",
    status: "Excellent",
    statusColor: "text-green-600",
    barColor: "from-green-400 to-green-500",
    tip: "Âm ngắn, khẩu hình thư giãn, miệng mở vừa.",
  },
  {
    symbol: "/ŋ/",
    status: "Cần luyện thêm",
    statusColor: "text-amber-600",
    barColor: "from-amber-300 to-amber-400",
    tip: "Nâng phần sau lưỡi chạm vòm mềm, giữ hơi qua mũi.",
  },
  {
    symbol: "/k/",
    status: "Excellent",
    statusColor: "text-green-600",
    barColor: "from-green-400 to-green-500",
    tip: "Ngắt hơi rõ ở phần sau lưỡi, bật mạnh ra.",
  },
];

export default function Speaking() {
  const [selected, setSelected] = useState(demoPhrases[0]);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #e8f4fd 0, #f2f8ff 40%, #f8fbff 75%)",
      }}
    >
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Hero */}
            <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-[#77BEF0] via-[#6fc6ff] to-[#9fdcff] text-white shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-80">
                    Luyện nói
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mt-2">
                    Phát âm chuẩn, tự tin giao tiếp
                  </h1>
                  <p className="mt-3 text-white/90 max-w-2xl">
                    Thực hành phát âm theo mẫu, ghi âm và so sánh. 
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
                      Pitch accent
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
                      Slow & Clear
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
                      Shadowing
                    </span>
                  </div>
                </div>
                <div className="bg-white/15 border border-white/25 rounded-2xl px-6 py-4 shadow-md">
                  <div className="text-sm opacity-90">Mục tiêu hôm nay</div>
                  <div className="text-3xl font-bold">10 câu</div>
                  <div className="mt-2 text-sm opacity-80">
                    Thử hoàn thành 3 câu đầu để làm nóng nhé!
                  </div>
                </div>
              </div>
            </div>

            {/* Practice + Phrases */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Phrase list */}
              <div className="lg:col-span-1 space-y-3">
                <div className="font-semibold text-gray-700">Câu mẫu</div>
                {demoPhrases.map((p) => (
                  <button
                    key={p.jp}
                    onClick={() => setSelected(p)}
                    className={`w-full text-left p-4 rounded-xl border transition shadow-sm ${
                      selected.jp === p.jp
                        ? "border-[#77BEF0] bg-white"
                        : "border-gray-200 bg-white hover:border-[#A6D8FF]"
                    }`}
                  >
                    <div className="text-sm text-[#77BEF0] font-semibold">
                      {p.topic}
                    </div>
                    <div className="text-lg font-bold text-gray-800 mt-1">
                      {p.jp}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{p.romaji}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.vi}</div>
                  </button>
                ))}
              </div>

              {/* Practice card */}
              <div className="lg:col-span-2 space-y-4">
                {/* Top card giống màn practice */}
                <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-md p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-orange-500 font-semibold">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-orange-400 text-sm">
                        79%
                      </span>
                      <span>Almost Correct</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">3/3 Today</span>
                      <span className="text-[#77BEF0]">🔊</span>
                      <span className="text-[#77BEF0]">👤</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-b from-white to-[#f7fbff] border border-[#E8F4FD] p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Speak the phrase</div>
                        <div className="text-3xl font-bold text-gray-800 mt-1">{selected.jp || "—"}</div>
                        <div className="text-base text-gray-600 mt-1">{selected.romaji}</div>
                        <div className="text-sm text-gray-500 mt-1">{selected.vi}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actionIcons.map((a) => (
                          <button
                            key={a.label}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8F4FD] text-[#0F6DB0] font-semibold hover:border-[#77BEF0] transition"
                          >
                            <span>{a.icon}</span>
                            <span>{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-xl">/</span>
                        <span className="text-lg font-semibold text-gray-800">{selected.jp ? "..." : ""}</span>
                      </div>
                      <button className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#77BEF0] to-[#5fb4ec] text-white font-semibold shadow-lg hover:brightness-110 transition">
                        Tap to Speak 🎙️
                      </button>
                    </div>
                  </div>

                  {/* Visual meter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Độ chính xác (demo)</span>
                      <span className="font-semibold text-[#77BEF0]">92%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#77BEF0] to-[#A6D8FF]" style={{ width: "92%" }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div className="p-2 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                        Âm tiết: <span className="font-semibold text-gray-800">95%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                        Ngữ điệu: <span className="font-semibold text-gray-800">90%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                        Nhịp: <span className="font-semibold text-gray-800">91%</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-gray-100" />

                  {/* Steps */}
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                      <div className="font-semibold text-gray-800">1. Nghe mẫu</div>
                      <div className="text-gray-600 mt-1">
                        Nghe chậm, chú ý trường âm / âm ngắt.
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                      <div className="font-semibold text-gray-800">2. Ghi âm</div>
                      <div className="text-gray-600 mt-1">
                        Nhấn mạnh trọng âm, giữ nhịp ổn định.
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                      <div className="font-semibold text-gray-800">3. So sánh</div>
                      <div className="text-gray-600 mt-1">
                        Nghe lại bản thu, sửa âm khó (r, tsu, sh, ch).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phân tích phát âm giống Elsa Speak */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        3/3 Left for Today
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-[#77BEF0]">🔊</span> Nghe mẫu
                        <span className="text-[#77BEF0]">👤</span> Bạn nói
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-orange-500 font-semibold">
                      <div className="w-8 h-8 rounded-full border-2 border-orange-400 flex items-center justify-center">
                        79%
                      </div>
                      <span>Almost Correct</span>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#E8F4FD]">
                    <div className="grid grid-cols-3 bg-[#F9FBFF] text-gray-600 text-sm font-semibold border-b border-[#E8F4FD]">
                      <div className="px-4 py-3">Âm</div>
                      <div className="px-4 py-3 col-span-2">Bạn nói</div>
                    </div>
                    <div className="divide-y divide-[#E8F4FD]">
                      {phonemeBreakdown.map((p) => (
                        <div key={p.symbol} className="grid grid-cols-3">
                          <div className="px-4 py-4 flex items-center gap-3 text-[#0F6DB0] font-semibold">
                            {p.symbol}
                            <button className="text-[#0F6DB0] hover:opacity-80" title="Nghe mẫu">
                              🔊
                            </button>
                          </div>
                          <div className="col-span-2 px-4 py-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className={`text-base font-semibold ${p.statusColor}`}>{p.status}</div>
                              <button className="text-[#0F6DB0] hover:opacity-80" title="Nghe lại bản thu">
                                🔊
                              </button>
                            </div>
                            <div className="text-sm text-gray-600">{p.tip}</div>
                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${p.barColor}`}
                                style={{ width: p.status === "Excellent" ? "95%" : p.status === "Almost Correct" ? "80%" : "60%" }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🧭</div>
                  <div className="font-semibold text-gray-800">Hướng dẫn nhanh</div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                    Nghe mẫu trước, tập trung vào âm khó (r / tsu / sh / ch).
                  </li>
                  <li className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                    Khi ghi âm, giữ nhịp đều, chú ý độ dài âm (trường âm).
                  </li>
                  <li className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                    Xem breakdown từng âm để biết lỗi khẩu hình và sửa ngay.
                  </li>
                  <li className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                    Lặp lại 3 lần/âm để ổn định muscle memory.
                  </li>
                </ul>
              </div>
            </div>

            {/* Tips & history */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-lg">💡</div>
                  <div className="font-semibold text-gray-800">Mẹo luyện nói</div>
                </div>
                <ul className="space-y-3 text-gray-700">
                  {tips.map((t) => (
                    <li
                      key={t}
                      className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-lg">📈</div>
                  <div className="font-semibold text-gray-800">Tiến độ gần đây (demo)</div>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Buổi 1</span>
                    <span className="font-semibold text-[#77BEF0]">8/10 câu</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#77BEF0] to-[#A6D8FF]" style={{ width: "80%" }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Buổi 2</span>
                    <span className="font-semibold text-[#77BEF0]">10/10 câu</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#77BEF0] to-[#A6D8FF]" style={{ width: "100%" }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Buổi 3</span>
                    <span className="font-semibold text-[#77BEF0]">6/10 câu</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#77BEF0] to-[#A6D8FF]" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

