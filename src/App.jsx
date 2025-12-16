import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Chatbot from "./pages/Chatbot";
import CreateFlashcard from "./pages/CreateFlashcard";
import VocabPractice from "./pages/VocabPractice";
import Flashcard from "./pages/Flashcard";
import SignIn from "./pages/SignIn";
import Vocab from "./pages/Vocab";
import VocabLevel from "./pages/VocabLevel";
import Grammar from "./pages/Grammar";
import GrammarLevel from "./pages/GrammarLevel";
import GrammarDetail from "./pages/GrammarDetail";
import Diary from "./pages/Diary";
import DiaryDetail from "./pages/DiaryDetail";
import VocabTopic from "./pages/VocabTopic.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import Listening from "./pages/Listening.jsx";
import Speaking from "./pages/Speaking.jsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/chatbot" element={<Chatbot />} />

        {/* --- Flashcard Routes --- */}
        <Route path="/flashcard" element={<Flashcard />} />
        <Route path="/flashcard/newflashcard" element={<CreateFlashcard />} />
        <Route path="/flashcard/folders/:folderName" element={<Flashcard />} />
        <Route path="/flashcard/vocab-practice/:id" element={<VocabPractice />} />

        <Route path="*" element={<Navigate to="/" />} />
        
        <Route path="/signin" element={<SignIn />} />
        {/* --- Vocab Routes --- */}
        <Route path="/vocab" element={<Vocab />} />
        <Route path="/vocab/:level" element={<VocabLevel />} />
        <Route path="/vocab/topic/:topicId" element={<VocabTopic />} />

        {/* --- Grammar Routes --- */}
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/grammar/:level" element={<GrammarLevel />} />
        <Route path="/grammar/:level/:grammarId" element={<GrammarDetail />} />

        {/* --- Listening Routes --- */}
        <Route path="/listening" element={<Listening />} />
        <Route path="/speaking" element={<Speaking />} />

        {/* --- Diary Routes --- */}
        <Route path="/diary" element={<Diary />} />
        <Route path="/diary/:title" element={<DiaryDetail />} />
        {/* --- Search Routes --- */}
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
