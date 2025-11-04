import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Vocab from "./pages/Vocab";
import VocabLevel from "./pages/VocabLevel";
import Grammar from "./pages/Grammar";
import GrammarLevel from "./pages/GrammarLevel";
import GrammarDetail from "./pages/GrammarDetail";
import Diary from "./pages/Diary";
import DiaryDetail from "./pages/DiaryDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />

        {/* --- Vocab Routes --- */}
        <Route path="/vocab" element={<Vocab />} />
        <Route path="/vocab/:level" element={<VocabLevel />} />

        {/* --- Grammar Routes --- */}
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/grammar/:level" element={<GrammarLevel />} />
        <Route path="/grammar/:level/:grammarId" element={<GrammarDetail />} />

        {/* --- Diary Routes --- */}
        <Route path="/diary" element={<Diary />} />
        <Route path="/diary/:title" element={<DiaryDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
